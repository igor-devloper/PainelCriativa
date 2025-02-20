"use server";

import { db } from "@/app/_lib/prisma";
import {
  type ExpenseCategory,
  type PaymentMethod,
  Prisma,
} from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ExpenseEdit } from "@/app/types";

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

async function updateBalance(
  prisma: Prisma.TransactionClient,
  userId: string,
  company: string,
  amount: Prisma.Decimal,
  operation: "increment" | "decrement",
) {
  const existingBalance = await prisma.userBalance.findFirst({
    where: {
      userId: userId,
      company: company,
    },
  });

  if (existingBalance) {
    return await prisma.userBalance.update({
      where: {
        id: existingBalance.id,
      },
      data: {
        balance: {
          [operation]: amount,
        },
      },
    });
  } else {
    return await prisma.userBalance.create({
      data: {
        userId: userId,
        company: company,
        balance: operation === "increment" ? amount : amount.negated(),
      },
    });
  }
}

export async function editExpense(expenseId: string, data: ExpenseEdit) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await db.$transaction(
      async (prisma) => {
        const currentExpense = await prisma.expense.findUnique({
          where: { id: expenseId },
          include: {
            block: {
              include: {
                request: true,
              },
            },
          },
        });

        if (!currentExpense) {
          throw new Error("Despesa não encontrada");
        }

        if (currentExpense.userId !== userId) {
          throw new Error("Você não tem permissão para editar esta despesa");
        }

        const oldAmount = currentExpense.amount;
        const newAmount = new Prisma.Decimal(data.amount);
        const difference = newAmount.sub(oldAmount);

        const updatedExpense = await prisma.expense.update({
          where: { id: expenseId },
          data: {
            name: data.name,
            description: data.description,
            amount: newAmount,
            category: data.category as ExpenseCategory,
            paymentMethod: data.paymentMethod as PaymentMethod,
            date: new Date(data.date),
            imageUrls: data.imageUrls,
          },
        });

        if (!difference.equals(new Prisma.Decimal(0))) {
          await updateBalance(
            prisma,
            currentExpense.block.request.userId,
            currentExpense.company,
            difference.abs(),
            difference.isPositive() ? "decrement" : "increment",
          );
        }

        return updatedExpense;
      },
      {
        maxWait: 10000,
        timeout: 60000,
      },
    );

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/accounting");
    revalidatePath(`/accounting/${result.blockId}`);

    return { success: true, data: JSON.parse(JSON.stringify(result)) };
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
    const result = await db.$transaction(
      async (prisma) => {
        const expense = await prisma.expense.findUnique({
          where: { id: expenseId },
          include: {
            block: {
              include: {
                request: true,
              },
            },
          },
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

        await updateBalance(
          prisma,
          expense.block.request.userId,
          expense.company,
          expense.amount,
          "increment",
        );

        return expense;
      },
      {
        maxWait: 10000,
        timeout: 60000,
      },
    );

    revalidatePath("/");
    revalidatePath("/dashboard");
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

export async function registerExpense(
  blockId: string,
  data: {
    name: string;
    description: string | null;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    date: Date;
    imageUrls: string[];
  },
) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await db.$transaction(
      async (prisma) => {
        const block = await prisma.accountingBlock.findUnique({
          where: { id: blockId },
          include: { request: true },
        });

        if (!block) {
          throw new Error("Bloco contábil não encontrado");
        }

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

        await updateBalance(
          prisma,
          block.request.userId,
          block.company,
          new Prisma.Decimal(data.amount),
          "decrement",
        );

        return expense;
      },
      {
        maxWait: 100000,
        timeout: 600000,
      },
    );

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/accounting");
    revalidatePath(`/accounting/${result.blockId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error registering expense:", error);
    throw error instanceof Error
      ? new Error(`Erro ao registrar despesa: ${error.message}`)
      : new Error("Erro ao registrar despesa");
  }
}
