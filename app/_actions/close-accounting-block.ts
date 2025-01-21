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
      (sum, expense) => new Prisma.Decimal(sum).plus(expense.amount),
      new Prisma.Decimal(0),
    );

    const remainingBalance = new Prisma.Decimal(block.request.amount).minus(
      totalExpenses,
    );

    const userBalance = await db.userBalance.findFirst({
      where: {
        userId: block.request.userId,
        company: block.company,
      },
    });

    let newBalance: Prisma.Decimal;

    if (remainingBalance.isPositive()) {
      // If there's remaining balance, add it to the user's balance
      newBalance = userBalance
        ? new Prisma.Decimal(userBalance.balance).plus(remainingBalance)
        : remainingBalance;
    } else {
      // If expenses exceeded the available amount, deduct the overspent amount from the user's balance
      newBalance = userBalance
        ? new Prisma.Decimal(userBalance.balance).plus(remainingBalance)
        : remainingBalance;
    }

    await db.$transaction(async (tx) => {
      // Update the accounting block
      await tx.accountingBlock.update({
        where: { id: blockId },
        data: {
          status: "CLOSED",
          currentBalance: remainingBalance,
        },
      });

      // Update the request
      await tx.request.update({
        where: { id: block.request.id },
        data: {
          status: "COMPLETED",
          balanceDeducted: totalExpenses,
          currentBalance: remainingBalance,
        },
      });

      // Update or create user balance
      // if (userBalance) {
      //   await tx.userBalance.update({
      //     where: { id: userBalance.id },
      //     data: {
      //       balance: newBalance,
      //     },
      //   });
      // } else {
      //   await tx.userBalance.create({
      //     data: {
      //       userId: block.request.userId,
      //       company: block.company,
      //       balance: newBalance,
      //     },
      //   });
      // }
    });

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
