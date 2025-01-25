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
  description: string | null;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: Date;
  imageUrls: string[];
}

interface EditExpenseData {
  id: string;
  name: string;
  description: string | null;
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

      const companies = [
        "GSM SOLARION 02",
        "CRIATIVA ENERGIA",
        "OESTE BIOGÁS",
        "EXATA I",
      ];
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
      include: { request: true },
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

        // Find existing balance for the block creator
        const existingBalance = await prisma.userBalance.findFirst({
          where: {
            userId: block.request.userId,
            company: block.company,
          },
        });

        // Update or create the balance for the block creator
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
                userId: block.request.userId,
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
export async function editExpense(data: EditExpenseData) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await db.$transaction(async (prisma) => {
      const oldExpense = await prisma.expense.findUnique({
        where: { id: data.id },
        include: { block: true },
      });

      if (!oldExpense) {
        throw new Error("Despesa não encontrada");
      }

      if (oldExpense.userId !== userId) {
        throw new Error("Você não tem permissão para editar esta despesa");
      }

      const updatedExpense = await prisma.expense.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          amount: new Prisma.Decimal(data.amount),
          category: data.category,
          paymentMethod: data.paymentMethod,
          date: data.date,
          imageUrls: data.imageUrls,
        },
      });

      // Update the balance of the block creator
      const balanceDifference = oldExpense.amount.sub(
        new Prisma.Decimal(data.amount),
      );
      await prisma.userBalance.updateMany({
        where: {
          userId: oldExpense.block.requestId,
          company: oldExpense.company,
        },
        data: {
          balance: {
            increment: balanceDifference,
          },
        },
      });

      return updatedExpense;
    });

    revalidatePath("/accounting");
    revalidatePath(`/accounting/${result.blockId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error editing expense:", error);
    throw error instanceof Error
      ? new Error(`Erro ao editar despesa: ${error.message}`)
      : new Error("Erro ao editar despesa");
  }
}

export async function deleteExpense(expenseId: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await db.$transaction(async (prisma) => {
      const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: { block: true },
      });

      if (!expense) {
        throw new Error("Despesa não encontrada");
      }

      if (expense.userId !== userId) {
        throw new Error("Você não tem permissão para excluir esta despesa");
      }

      await prisma.expense.delete({
        where: { id: expenseId },
      });

      // Update the balance of the block creator
      await prisma.userBalance.updateMany({
        where: {
          userId: expense.block.requestId,
          company: expense.company,
        },
        data: {
          balance: {
            increment: expense.amount,
          },
        },
      });

      return expense;
    });

    revalidatePath("/accounting");
    revalidatePath(`/accounting/${result.blockId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error instanceof Error
      ? new Error(`Erro ao excluir despesa: ${error.message}`)
      : new Error("Erro ao excluir despesa");
  }
}
