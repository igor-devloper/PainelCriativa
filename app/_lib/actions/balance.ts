/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  type ExpenseCategory,
  type PaymentMethod,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ExpenseEdit } from "@/app/types";

// Cache em memória simples
const cache = new Map<string, { data: any; expiry: number }>();

/**
 * Função para executar consultas com cache
 */
async function queryWithCache<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds = 60,
): Promise<T> {
  // Verifica se o resultado está em cache e não expirou
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }

  // Executa a consulta
  const result = await queryFn();

  // Armazena o resultado em cache
  cache.set(cacheKey, {
    data: result,
    expiry: Date.now() + ttlSeconds * 1000,
  });

  return result;
}

/**
 * Limpa o cache por prefixo
 */
function clearCache(prefix?: string): void {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

/**
 * Função para executar consultas com retry automático
 */
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Verifica se é um erro de conexão fechada
      const isConnectionError =
        error.message.includes("Connection closed") ||
        error.message.includes("Connection terminated") ||
        error.code === "P2023" || // Prisma: Inconsistent query
        error.code === "P2024" || // Prisma: Connection pool timeout
        error.code === "P2025"; // Prisma: Record not found

      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Aumenta o delay exponencialmente para cada nova tentativa
      delay *= 2;
    }
  }

  throw lastError;
}

export async function getUserBalance(
  company?: string,
): Promise<number | { [key: string]: number }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Usa cache para reduzir consultas ao banco
  return queryWithCache(
    `user-balance-${userId}-${company || "all"}`,
    async () => {
      try {
        if (company) {
          // Get balance for specific company
          const userBalance = await executeWithRetry(() =>
            db.userBalance.findFirst({
              where: {
                userId: userId,
                company: company,
              },
            }),
          );

          if (!userBalance) {
            // If no balance record exists, create one with a zero balance
            await executeWithRetry(() =>
              db.userBalance.create({
                data: {
                  userId,
                  company,
                  balance: new Prisma.Decimal(0),
                },
              }),
            );
            return 0;
          }

          return Number(userBalance.balance);
        } else {
          // Get balances for all companies
          const userBalances = await executeWithRetry(() =>
            db.userBalance.findMany({
              where: {
                userId,
              },
            }),
          );

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
    },
    // Cache por 30 segundos
    30,
  );
}

async function updateBalance(
  prisma: Prisma.TransactionClient,
  userId: string,
  company: string,
  amount: Prisma.Decimal,
  operation: "increment" | "decrement",
) {
  try {
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
  } catch (error) {
    console.error(
      `Erro ao ${operation === "increment" ? "adicionar" : "subtrair"} saldo:`,
      error,
    );
    throw error;
  }
}

export async function editExpense(expenseId: string, data: ExpenseEdit) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Aumenta os timeouts para transações
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
        maxWait: 20000, // Aumenta o tempo máximo de espera
        timeout: 120000, // Aumenta o timeout da transação
      },
    );

    // Limpa o cache após modificações
    clearCache(`user-balance-${userId}`);

    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error("Error editing expense:", error);
    throw error instanceof Error
      ? new Error(`Erro ao editar despesa: ${error.message}`)
      : new Error("Erro ao editar despesa");
  }
}

export async function deleteExpense(expenseId: string) {
  const { userId } = await auth();

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
        maxWait: 20000, // Aumenta o tempo máximo de espera
        timeout: 120000, // Aumenta o timeout da transação
      },
    );

    // Limpa o cache após modificações
    clearCache(`user-balance-${userId}`);

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/accounting");
    revalidatePath(`/accounting/${result.blockId}`);

    return { success: true, data: JSON.parse(JSON.stringify(result)) };
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
  const { userId } = await auth();

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
        maxWait: 20000, // Aumenta o tempo máximo de espera
        timeout: 120000, // Aumenta o timeout da transação
      },
    );

    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error("Error registering expense:", error);
    throw error instanceof Error
      ? new Error(`Erro ao registrar despesa: ${error.message}`)
      : new Error("Erro ao registrar despesa");
  }
}
