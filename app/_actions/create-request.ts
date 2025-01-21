"use server";

import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface CreateRequestData {
  name: string;
  description: string;
  amount: number;
  responsibleCompany: string;
  phoneNumber: string;
}

export async function createRequest(data: CreateRequestData) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    // Validate input data
    if (
      !data.name ||
      !data.description ||
      !data.amount ||
      !data.responsibleCompany ||
      !data.phoneNumber
    ) {
      throw new Error("Todos os campos são obrigatórios");
    }

    // Fetch or create UserBalance for the specific company
    const userBalance = await db.userBalance.findFirst({
      where: {
        userId,
        company: data.responsibleCompany,
      },
    });

    const balance = userBalance ? userBalance.balance : new Prisma.Decimal(0);
    const requestedAmount = new Prisma.Decimal(data.amount);

    let totalRequestAmount: Prisma.Decimal;

    if (balance.isNegative()) {
      // If user has negative balance, add it to the request amount
      totalRequestAmount = requestedAmount.minus(balance); // This adds the negative balance
    } else {
      totalRequestAmount = requestedAmount;
    }

    // Create the request
    const result = await db.$transaction(async (tx) => {
      const request = await tx.request.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          amount: totalRequestAmount, // This is the total amount including negative balance
          currentBalance: requestedAmount, // This is the original requested amount
          responsibleCompany: data.responsibleCompany,
          status: "WAITING",
          phoneNumber: data.phoneNumber,
          initialUserBalance: balance,
          balanceDeducted: new Prisma.Decimal(0), // Initially, no balance is deducted
        },
      });

      return request;
    });

    revalidatePath("/requests");

    return {
      success: true,
      request: result,
    };
  } catch (error) {
    console.error("Error creating request:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro ao criar solicitação. Por favor, tente novamente.");
  }
}
