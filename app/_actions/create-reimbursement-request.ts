import { db } from "@/app/_lib/prisma";
import { RequestStatus, RequestType, BlockStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { notifyAdminsAndFinance } from "../_lib/email-utils";

export async function createReimbursementRequest(
  blockId: string,
  negativeBalance: number,
) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const block = await db.accountingBlock.findUnique({
    where: { id: blockId },
    include: {
      request: true,
    },
  });

  if (!block) {
    throw new Error("Bloco não encontrado");
  }

  const userBalance = await db.userBalance.findFirst({
    where: { userId, company: block.company },
  });

  if (!userBalance) {
    throw new Error("Saldo do usuário não encontrado");
  }

  // Create reimbursement request
  const reimbursementRequest = await db.request.create({
    data: {
      userId,
      name: `Reembolso - ${block.code}`,
      description: `Reembolso referente ao bloco ${block.code}`,
      amount: Math.abs(negativeBalance),
      currentBalance: userBalance.balance,
      initialUserBalance: userBalance.balance,
      balanceDeducted: 0, // No balance deduction for reimbursement
      status: RequestStatus.AUTHORIZES,
      type: RequestType.REIMBURSEMENT,
      phoneNumber: "", // You might want to get this from Clerk user metadata
      responsibleCompany: block.company,
      expectedDate: new Date(), // Set to current date or adjust as needed
      // Copy bank information from original request
      bankName: block.request?.bankName || null,
      accountType: block.request?.accountType || null,
      accountNumber: block.request?.accountNumber || null,
      accountHolderName: block.request?.accountHolderName || null,
      pixKey: block.request?.pixKey || null,
    },
    include: {
      accountingBlock: true,
    },
  });

  // Update block status
  await db.accountingBlock.update({
    where: { id: blockId },
    data: {
      status: BlockStatus.APPROVED, // or another appropriate status
    },
  });

  // Notify admins and finance
  await notifyAdminsAndFinance({
    title: "Nova solicitação de reembolso",
    message: `Um novo reembolso no valor de R$ ${Math.abs(negativeBalance)} foi solicitado para o bloco ${block.code}.`,
    requestId: reimbursementRequest.id,
  });

  return reimbursementRequest;
}
