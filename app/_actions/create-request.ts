"use server";

import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

interface CreateRequestData {
  name: string;
  description: string;
  amount: number;
  phoneNumber: string;
  responsibleCompany: string;
}

export async function createRequest(data: CreateRequestData) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Fetch or create UserBalance
    let userBalance = await db.userBalance.findUnique({
      where: { userId },
    });

    if (!userBalance) {
      userBalance = await db.userBalance.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    const balance = new Prisma.Decimal(userBalance.balance);
    const requestAmount = new Prisma.Decimal(data.amount);
    let amountToAllocate: Prisma.Decimal;
    let initialBlockBalance: Prisma.Decimal;

    if (balance.isNegative()) {
      // If balance is negative, allocate balance + requested amount
      amountToAllocate = balance.abs().plus(requestAmount);
      initialBlockBalance = requestAmount;
    } else {
      // If balance is positive or zero
      amountToAllocate = requestAmount;
      initialBlockBalance = requestAmount;

      // Deduct the request amount from the user's balance
      await db.userBalance.update({
        where: { userId },
        data: {
          balance: balance.minus(requestAmount),
        },
      });
    }

    // Create the request
    const request = await db.request.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        phoneNumber: data.phoneNumber,
        amount: amountToAllocate,
        currentBalance: initialBlockBalance,
        responsibleCompany: data.responsibleCompany,
        status: "WAITING",
      },
    });

    return {
      success: true,
      request,
      amountToAllocate: amountToAllocate.toNumber(),
      initialBlockBalance: initialBlockBalance.toNumber(),
    };
  } catch (error) {
    console.error("Error creating request:", error);
    throw new Error("Failed to create request");
  }
}
