import { db } from "@/app/_lib/prisma";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";
import { auth } from "@clerk/nextjs/server";

export const getDashboard = async (month: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const currentYear = new Date().getFullYear();

  // Create date range based on month selection
  const startDate =
    month === "all"
      ? new Date(currentYear, 0, 1) // January 1st of current year
      : new Date(currentYear, parseInt(month) - 1, 1); // First day of selected month

  const endDate =
    month === "all"
      ? new Date(currentYear + 1, 0, 1) // January 1st of next year
      : new Date(currentYear, parseInt(month), 0); // Last day of selected month

  const where = {
    userId,
    date: {
      gte: startDate,
      lt: endDate,
    },
  };

  const depositsTotal = Number(
    (
      await db.transaction.aggregate({
        where: {
          ...where,
          type: TransactionType.DEPOSIT,
          status: {
            not: TransactionStatus.WAITING,
          },
        },
        _sum: { amount: true },
      })
    )?._sum?.amount ?? 0,
  );

  const expensesTotal = Number(
    (
      await db.transaction.aggregate({
        where: {
          ...where,
          type: TransactionType.EXPENSE,
        },
        _sum: { amount: true },
      })
    )?._sum?.amount ?? 0,
  );

  const refound = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: TransactionType.REFUND },

        _sum: { amount: true },
      })
    )?._sum?.amount ?? 0,
  );

  const balance = depositsTotal - expensesTotal + refound;

  const transactionsTotal = depositsTotal + expensesTotal;

  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: transactionsTotal
      ? Math.round((depositsTotal / transactionsTotal) * 100)
      : 0,
    [TransactionType.EXPENSE]: transactionsTotal
      ? Math.round((expensesTotal / transactionsTotal) * 100)
      : 0,
    [TransactionType.REFUND]: transactionsTotal
      ? Math.round((expensesTotal / transactionsTotal) * 100)
      : 0,
  };

  const totalExpensePerCategory: TotalExpensePerCategory[] = (
    await db.transaction.groupBy({
      by: ["category"],
      where: {
        ...where,
        type: TransactionType.EXPENSE,
      },
      _sum: {
        amount: true,
      },
    })
  ).map((category) => ({
    category: category.category,
    totalAmount: Number(category._sum.amount ?? 0),
    percentageOfTotal: expensesTotal
      ? Math.round((Number(category._sum.amount ?? 0) / expensesTotal) * 100)
      : 0,
  }));

  const lastTransactions = await db.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return {
    balance,
    depositsTotal,
    expensesTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions: JSON.parse(
      JSON.stringify(
        lastTransactions.map((transaction) => ({
          ...transaction,
          amount:
            transaction.type === TransactionType.DEPOSIT &&
            transaction.status === TransactionStatus.WAITING
              ? 0
              : Number(transaction.amount),
        })),
      ),
    ),
  };
};
