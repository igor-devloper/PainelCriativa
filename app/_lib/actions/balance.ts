/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/app/_lib/prisma";
import { ExpenseEdit } from "@/app/types";
import { auth } from "@clerk/nextjs/server";
import {
  type ExpenseCategory,
  type PaymentMethod,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// Cache em memória simples
const cache = new Map<string, { data: any; expiry: number }>();

async function queryWithCache<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds = 60,
): Promise<T> {
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  const result = await queryFn();
  cache.set(cacheKey, {
    data: result,
    expiry: Date.now() + ttlSeconds * 1000,
  });
  return result;
}

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
      const isConnectionError =
        error.message.includes("Connection closed") ||
        error.message.includes("Connection terminated") ||
        error.code === "P2023" ||
        error.code === "P2024" ||
        error.code === "P2025";
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      console.warn(
        `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw lastError;
}

export async function getUserBalance(
  company?: string,
): Promise<number | { [key: string]: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  return queryWithCache(
    `user-balance-${userId}-${company || "all"}`,
    async () => {
      if (company) {
        const userBalance = await executeWithRetry(() =>
          db.userBalance.findFirst({ where: { userId, company } }),
        );
        if (!userBalance) {
          await executeWithRetry(() =>
            db.userBalance.create({
              data: { userId, company, balance: new Prisma.Decimal(0) },
            }),
          );
          return 0;
        }
        return Number(userBalance.balance);
      } else {
        const userBalances = await executeWithRetry(() =>
          db.userBalance.findMany({ where: { userId } }),
        );
        const companies = [
          "GSM SOLARION 02",
          "CRIATIVA ENERGIA",
          "OESTE BIOGÁS",
          "EXATA I",
        ];
        const balances: { [key: string]: number } = {};
        for (const company of companies) {
          const balance = userBalances.find((b) => b.company === company);
          balances[company] = balance ? Number(balance.balance) : 0;
        }
        return balances;
      }
    },
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
  const existingBalance = await prisma.userBalance.findFirst({
    where: { userId, company },
  });
  if (existingBalance) {
    return prisma.userBalance.update({
      where: { id: existingBalance.id },
      data: { balance: { [operation]: amount } },
    });
  } else {
    return prisma.userBalance.create({
      data: {
        userId,
        company,
        balance: operation === "increment" ? amount : amount.negated(),
      },
    });
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

        if (currentExpense.block.status !== "OPEN") {
          throw new Error("Esté bloco está fechado");
        }
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
  if (!userId) throw new Error("Unauthorized");

  try {
    const result = await db.$transaction(
      async (prisma) => {
        const expense = await prisma.expense.findUnique({
          where: { id: expenseId },
          include: { block: { include: { request: true } } },
        });

        if (!expense) throw new Error("Despesa não encontrada");
        if (expense.userId !== userId)
          throw new Error("Você não tem permissão para excluir esta despesa");

        await prisma.expense.delete({ where: { id: expenseId } });

        const amount = expense.amount;

        // Reverter saldos com base no tipo
        if (expense.type === "CAIXA" || expense.type === "REEMBOLSO") {
          await updateBalance(
            prisma,
            expense.block.request.userId,
            expense.company,
            amount,
            "decrement",
          );
          await prisma.accountingBlock.update({
            where: { id: expense.blockId },
            data: { currentBalance: { decrement: amount } },
          });
        } else if (expense.type === "DESPESA") {
          await updateBalance(
            prisma,
            expense.block.request.userId,
            expense.company,
            amount,
            "increment",
          );
          await prisma.accountingBlock.update({
            where: { id: expense.blockId },
            data: { currentBalance: { increment: amount } },
          });
        }

        return expense;
      },
      {
        maxWait: 20000,
        timeout: 120000,
      },
    );

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
    type: "CAIXA" | "DESPESA" | "REEMBOLSO";
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

        const amountDecimal = new Prisma.Decimal(data.amount);
        if (block.status !== "OPEN") {
          throw new Error("Esté bloco está fechado");
        }
        const expense = await prisma.expense.create({
          data: {
            name: data.name,
            description: data.description,
            amount: amountDecimal,
            category: data.category,
            paymentMethod: data.paymentMethod,
            date: data.date,
            blockId: blockId,
            userId: userId,
            imageUrls: data.imageUrls,
            status: "WAITING",
            company: block.company,
            type: data.type,
          },
        });

        // Atualiza saldos conforme tipo de registro
        if (data.type === "CAIXA" || data.type === "REEMBOLSO") {
          // Adiciona ao saldo do usuário e do bloco
          await updateBalance(
            prisma,
            block.request.userId,
            block.company,
            amountDecimal,
            "increment",
          );

          await prisma.accountingBlock.update({
            where: { id: blockId },
            data: {
              currentBalance: {
                increment: amountDecimal,
              },
            },
          });
        } else if (data.type === "DESPESA") {
          // Subtrai do saldo do usuário e do bloco
          await updateBalance(
            prisma,
            block.request.userId,
            block.company,
            amountDecimal,
            "decrement",
          );

          await prisma.accountingBlock.update({
            where: { id: blockId },
            data: {
              currentBalance: {
                decrement: amountDecimal,
              },
            },
          });
        }

        return expense;
      },
      {
        maxWait: 20000,
        timeout: 120000,
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
