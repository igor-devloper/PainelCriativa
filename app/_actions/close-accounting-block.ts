/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAccountingPDF } from "@/app/_utils/generate-pdf";
import { db } from "../_lib/prisma";
import { uploadPdfToSupabase } from "../_lib/upload";
import { type AccountingBlock, type ExpenseRequest, type ExpenseItem, convertPrismaToAccountingBlock } from "@/app/types";

// Função helper para converter dados do Prisma
// function convertPrismaToAccountingBlock(prismaBlock: any): AccountingBlock {
//   return {
//     id: prismaBlock.id,
//     code: prismaBlock.code,
//     requestId: prismaBlock.requestId,
//     status: prismaBlock.status,
//     pdfUrl: prismaBlock.pdfUrl,
//     initialAmount: prismaBlock.initialAmount.toNumber(),
//     currentBalance: prismaBlock.currentBalance.toNumber(),
//     saldoFinal: prismaBlock.saldoFinal?.toNumber() || null,
//     createdAt: prismaBlock.createdAt,
//     updatedAt: prismaBlock.updatedAt,
//     company: prismaBlock.company,
//     expenses: prismaBlock.expenses.map((expense: any): ExpenseItem => ({
//       id: expense.id,
//       name: expense.name,
//       description: expense.description,
//       amount: expense.amount.toNumber(),
//       category: expense.category,
//       paymentMethod: expense.paymentMethod,
//       blockId: expense.blockId,
//       date: expense.date,
//       status: expense.status,
//       type: expense.type,
//       userId: expense.userId,
//       imageUrls: expense.imageUrls,
//       createdAt: expense.createdAt,
//       updatedAt: expense.updatedAt,
//       company: expense.company,
//     })),
//     request: prismaBlock.request ? {
//       id: prismaBlock.request.id,
//       name: prismaBlock.request.name,
//       description: prismaBlock.request.description,
//       amount: prismaBlock.request.amount.toNumber(),
//       currentBalance: prismaBlock.request.currentBalance?.toNumber() || null,
//       initialUserBalance: prismaBlock.request.initialUserBalance?.toNumber() || 0,
//       balanceDeducted: prismaBlock.request.balanceDeducted?.toNumber() || 0,
//       status: prismaBlock.request.status,
//       userId: prismaBlock.request.userId,
//       phoneNumber: prismaBlock.request.phoneNumber,
//       type: prismaBlock.request.type,
//       financeId: prismaBlock.request.financeId,
//       expectedDate: prismaBlock.request.expectedDate,
//       denialReason: prismaBlock.request.denialReason,
//       proofUrl: prismaBlock.request.proofUrl,
//       createdAt: prismaBlock.request.createdAt,
//       updatedAt: prismaBlock.request.updatedAt,
//       responsibleCompany: prismaBlock.request.responsibleCompany,
//       whatsappMessageId: prismaBlock.request.whatsappMessageId,
//       whatsappMessageStatus: prismaBlock.request.whatsappMessageStatus,
//       whatsappMessageError: prismaBlock.request.whatsappMessageError,
//       gestor: prismaBlock.request.gestor,
//       responsibleValidationUserID: prismaBlock.request.responsibleValidationUserID,
//       bankName: prismaBlock.request.bankName,
//       accountType: prismaBlock.request.accountType,
//       accountNumber: prismaBlock.request.accountNumber,
//       accountHolderName: prismaBlock.request.accountHolderName,
//       pixKey: prismaBlock.request.pixKey,
//     } : null,
//   };
// }

export async function closeAccountingBlock(blockId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Usuário não autenticado");

  const prismaBlock = await db.accountingBlock.findUnique({
    where: { id: blockId },
    include: {
      expenses: true,
      request: true,
    },
  });

  if (!prismaBlock) throw new Error("Bloco não encontrado");

  // Converter dados do Prisma para tipos customizados
  const block = convertPrismaToAccountingBlock(prismaBlock);


  // Calcular saldo total
  const saldo = block.expenses.reduce((acc, t) => {
    return t.type === "CAIXA" ? acc + t.amount : acc - t.amount;
  }, 0);

  // Validar fechamento com saldo negativo
  if (saldo < 0) {
    const temReembolso = block.expenses.some((t) => t.type === "REEMBOLSO");
    if (!temReembolso) {
      return {
        status: "awaiting_reimbursement",
        message:
          "Bloco com saldo negativo. Adicione um reembolso para poder fechar.",
      };
    }
  }

  // Gerar PDF - agora com dados convertidos
  const companyName = block.company;
  const responsibleName =
    block.request?.accountHolderName ?? "Usuário Responsável";

  const doc = await generateAccountingPDF(block, companyName, responsibleName);

  const pdfBlob = doc.output("blob");
  const buffer = await pdfBlob.arrayBuffer();
  const pdfUrl = await uploadPdfToSupabase(
    Buffer.from(buffer),
    `${block.code}.pdf`,
  );

  // Atualiza e apaga o bloco, despesas e request
  await db.$transaction(async (prisma) => {
    // Atualiza com status final e PDF
    await prisma.accountingBlock.update({
      where: { id: blockId },
      data: {
        status: "CLOSED",
        saldoFinal: prismaBlock.currentBalance, // Use o valor original do Prisma
        pdfUrl,
        requestId: null,
      },
    });

    // Deleta despesas
    await prisma.expense.deleteMany({
      where: { blockId },
    });

    // Deleta request
    if (prismaBlock.request?.id) {
      await prisma.request.delete({
        where: { id: prismaBlock.request.id },
      });
    }
  });

  revalidatePath("/accounting");

  return {
    status: "closed",
    saldoFinal: saldo,
    pdfUrl,
    message: "Bloco fechado com sucesso e dados apagados.",
  };
}