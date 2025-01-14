"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function closeAccountingBlock(blockId: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const block = await db.accountingBlock.findUnique({
      where: { id: blockId },
      include: {
        request: true,
        expenses: true,
      },
    });

    if (!block) {
      throw new Error("Accounting block not found");
    }

    const totalExpenses = block.expenses.reduce(
      (sum: Prisma.Decimal.Value, expense: { amount: Prisma.Decimal.Value }) =>
        new Prisma.Decimal(sum).plus(expense.amount),
      new Prisma.Decimal(0),
    );

    const remainingBalance = new Prisma.Decimal(block.request.amount).minus(
      totalExpenses,
    );

    const userBalance = await db.userBalance.findUnique({
      where: { userId },
    });

    const newBalance = userBalance
      ? new Prisma.Decimal(userBalance.balance).plus(remainingBalance)
      : remainingBalance;

    await db.$transaction([
      db.accountingBlock.update({
        where: { id: blockId },
        data: { status: "CLOSED" },
      }),
      db.userBalance.upsert({
        where: { userId },
        create: {
          userId,
          balance: newBalance,
        },
        update: {
          balance: newBalance,
        },
      }),
    ]);

    revalidatePath("/accounting");
    revalidatePath(`/accounting/${blockId}`);

    return {
      success: true,
      message: "Accounting block closed successfully",
      remainingBalance: remainingBalance.toNumber(),
      newBalance: newBalance.toNumber(),
    };
  } catch (error) {
    console.error("Error closing accounting block:", error);
    throw new Error("Failed to close accounting block");
  }
}
