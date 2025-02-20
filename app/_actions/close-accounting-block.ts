"use server";

import { db } from "@/app/_lib/prisma";
import { createReimbursementRequest } from "./create-reimbursement-request";
import { BlockStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function closeAccountingBlock(blockId: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const block = await db.accountingBlock.findUnique({
    where: { id: blockId },
    include: {
      expenses: true,
      request: true,
    },
  });

  if (!block) {
    throw new Error("Bloco não encontrado");
  }

  // Calculate total expenses
  const totalExpenses = block.expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  // Calculate balance
  const balance = Number(block.initialAmount) - totalExpenses;

  // If balance is negative, create reimbursement request
  if (balance < 0) {
    const reimbursementRequest = await createReimbursementRequest(
      blockId,
      Math.abs(balance),
    );
    return {
      status: "reimbursement_pending",
      message:
        "Solicitação de reembolso criada. O bloco será fechado após o reembolso ser processado.",
      reimbursementRequestId: reimbursementRequest.id,
    };
  }

  // If balance is positive or zero, close the block immediately
  await db.accountingBlock.update({
    where: { id: blockId },
    data: {
      status: BlockStatus.CLOSED,
      currentBalance: balance,
    },
  });

  revalidatePath("/accounting");

  return {
    status: "closed",
    message: "Bloco fechado com sucesso",
    success: true,
    remainingBalance: balance,
    newBalance: balance,
  };
}
