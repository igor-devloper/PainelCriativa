"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export async function getUserBalance(): Promise<number> {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const userBalance = await db.userBalance.findUnique({
    where: { userId },
  });

  return userBalance ? Number(userBalance.balance) : 0;
}

export async function registerExpense(
  blockId: string,
  expenseData: {
    name: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
    date: Date;
    imageUrls: string[];
  },
) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const block = await db.accountingBlock.findUnique({
    where: { id: blockId },
    include: { request: true },
  });

  if (!block) throw new Error("Block not found");
  if (block.status !== "OPEN")
    throw new Error("Cannot add expenses to a closed block");
  if (block.request.userId !== userId) throw new Error("Unauthorized");

  const expenseAmount = new Decimal(expenseData.amount.toString());
  const currentBalance = new Decimal(block.request.currentBalance.toString());
  const newBalance = currentBalance.minus(expenseAmount);

  await db.$transaction([
    db.expense.create({
      data: {
        name: expenseData.name,
        description: expenseData.description,
        amount: expenseAmount,
        category: expenseData.category as ExpenseCategory,
        paymentMethod: expenseData.paymentMethod as PaymentMethod,
        date: expenseData.date,
        imageUrls: expenseData.imageUrls,
        blockId,
        userId,
      },
    }),
    db.request.update({
      where: { id: block.request.id },
      data: {
        currentBalance: newBalance,
      },
    }),
  ]);

  revalidatePath("/accounting");
}

export async function createNewRequest(requestData: {
  name: string;
  description: string;
  phoneNumber: string;
  amount: Decimal;
  responsibleCompany: string;
  expectedDate?: Date | null;
}) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const userBalance = await getUserBalance();
  const requestAmount = new Decimal(requestData.amount.toString());

  let finalAmount: Decimal;
  let initialBlockBalance: Decimal = requestAmount; // Set initial block balance to full amount

  if (userBalance > 0) {
    const userBalanceDecimal = new Decimal(userBalance.toString());
    const difference = requestAmount.minus(userBalanceDecimal);
    finalAmount = difference.isPositive() ? difference : new Decimal(0);

    // If user has balance, it will be used to cover part or all of the request
    if (userBalanceDecimal.gte(requestAmount)) {
      initialBlockBalance = requestAmount;
    } else {
      initialBlockBalance = requestAmount;
    }

    await db.userBalance.update({
      where: { userId },
      data: {
        balance: userBalanceDecimal.minus(requestAmount).isPositive()
          ? userBalanceDecimal.minus(requestAmount)
          : new Decimal(0),
      },
    });
  } else if (userBalance < 0) {
    const absUserBalance = new Decimal(Math.abs(userBalance).toString());
    finalAmount = requestAmount.plus(absUserBalance);
    initialBlockBalance = requestAmount;

    await db.userBalance.update({
      where: { userId },
      data: { balance: new Decimal(0) },
    });
  } else {
    finalAmount = requestAmount;
    initialBlockBalance = requestAmount;
  }

  const newRequest = await db.request.create({
    data: {
      name: requestData.name,
      description: requestData.description,
      amount: finalAmount,
      phoneNumber: requestData.phoneNumber,
      currentBalance: initialBlockBalance, // Set the initial balance here
      responsibleCompany: requestData.responsibleCompany,
      expectedDate: requestData.expectedDate,
      userId,
      status: "WAITING",
    },
  });

  revalidatePath("/requests");
  return newRequest;
}