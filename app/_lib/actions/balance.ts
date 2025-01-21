"use server";

import { db } from "@/app/_lib/prisma";
import {
  type ExpenseCategory,
  type PaymentMethod,
  Prisma,
} from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface RegisterExpenseData {
  name: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: Date;
  imageUrls: string[];
}

export async function getUserBalance(
  company?: string,
): Promise<number | { [key: string]: number }> {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    if (company) {
      // Get balance for specific company
      const userBalance = await db.userBalance.findFirst({
        where: {
          userId: userId,
          company: company,
        },
      });

      if (!userBalance) {
        // If no balance record exists, create one with a zero balance
        await db.userBalance.create({
          data: {
            userId,
            company,
            balance: new Prisma.Decimal(0),
          },
        });
        return 0;
      }

      return Number(userBalance.balance);
    } else {
      // Get balances for all companies
      const userBalances = await db.userBalance.findMany({
        where: {
          userId,
        },
      });

      const companies = ["GSM SOLARION 02", "CRIATIVA ENERGIA", "OESTE BIOGÁS"];
      const balances: { [key: string]: number } = {};

      // Initialize all companies with 0 balance
      for (const company of companies) {
        const balance = userBalances.find((b) => b.company === company);
        balances[company] = balance ? Number(balance.balance) : 0;
      }

      return balances;
    }
  } catch (error) {
    console.error("Error fetching user balance:", error);
    throw new Error("Failed to fetch user balance");
  }
}

export async function registerExpense(
  blockId: string,
  data: RegisterExpenseData,
) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const block = await db.accountingBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new Error("Bloco contábil não encontrado");
    }

    // Start a transaction
    const result = await db.$transaction(
      async (prisma) => {
        // Create the expense
        const expense = await prisma.expense.create({
          data: {
            name: data.name,
            description: data.description,
            amount: new Prisma.Decimal(data.amount),
            category: data.category,
            paymentMethod: data.paymentMethod,
            date: data.date,
            blockId: blockId,
            userId: userId,
            imageUrls: data.imageUrls,
            status: "WAITING",
            company: block.company,
          },
        });

        // Find existing balance first
        const existingBalance = await prisma.userBalance.findFirst({
          where: {
            userId: userId,
            company: block.company,
          },
        });

        // Update or create the balance
        const updatedBalance = existingBalance
          ? await prisma.userBalance.update({
              where: {
                id: existingBalance.id,
              },
              data: {
                balance: {
                  decrement: data.amount,
                },
              },
            })
          : await prisma.userBalance.create({
              data: {
                userId: userId,
                company: block.company,
                balance: new Prisma.Decimal(-data.amount),
              },
            });

        return { expense, updatedBalance };
      },
      {
        maxWait: 10000, // Tempo de espera em milissegundos
        timeout: 60000, // Tempo limite da transação em milissegundos
      },
    );

    revalidatePath("/accounting");
    revalidatePath(`/accounting/${blockId}`);

    return {
      success: true,
      data: result.expense,
      updatedBalance: Number(result.updatedBalance.balance),
    };
  } catch (error) {
    console.error("Error registering expense:", error);
    throw error instanceof Error
      ? new Error(`Erro ao registrar despesa: ${error.message}`)
      : new Error("Erro ao registrar despesa");
  }
}
