"use server";

import { db } from "@/app/_lib/prisma";
import { ExpenseCategory, PaymentMethod, Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function registerExpense(
  blockId: string,
  data: {
    name: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
    date: Date;
    imageUrls: string[];
  },
) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const block = await db.accountingBlock.findUnique({
      where: { id: blockId },
      include: { request: true },
    });

    if (!block) {
      throw new Error("Block not found");
    }

    if (block.status !== "OPEN") {
      throw new Error("Cannot add expenses to a closed block");
    }

    if (block.request.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const expenseAmount = new Prisma.Decimal(data.amount.toString());
    const currentBalance = new Prisma.Decimal(
      block.request.currentBalance.toString(),
    );
    const newBalance = currentBalance.minus(expenseAmount);

    await db.$transaction(async (tx) => {
      // Create the expense
      await tx.expense.create({
        data: {
          name: data.name,
          description: data.description,
          amount: expenseAmount,
          category: data.category as ExpenseCategory,
          paymentMethod: data.paymentMethod as PaymentMethod,
          date: data.date,
          imageUrls: data.imageUrls,
          blockId,
          userId,
          status: "WAITING",
        },
      });

      // Update request's current balance
      await tx.request.update({
        where: { id: block.request.id },
        data: {
          currentBalance: newBalance,
        },
      });

      // Update accounting block's current balance
      await tx.accountingBlock.update({
        where: { id: blockId },
        data: {
          currentBalance: newBalance,
        },
      });
    });

    revalidatePath("/accounting");
    revalidatePath(`/accounting/${blockId}`);

    return { success: true };
  } catch (error) {
    console.error("Error registering expense:", error);
    throw error;
  }
}

export async function getUserBalance(): Promise<number> {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    const userBalance = await db.userBalance.findUnique({
      where: { userId },
    });

    if (!userBalance) {
      // If no balance record exists, create one with a zero balance
      await db.userBalance.create({
        data: {
          userId,
          balance: new Prisma.Decimal(0),
        },
      });
      return 0;
    }

    return Number(userBalance.balance);
  } catch (error) {
    console.error("Error fetching user balance:", error);
    throw new Error("Failed to fetch user balance");
  }
}

// Other existing functions remain unchanged...
