import { db } from "@/app/_lib/prisma";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";
import { auth } from "@clerk/nextjs/server";
import { userAdmin } from "../user-admin";

export const getDashboard = async (month: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const currentYear = new Date().getFullYear();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Create date range based on month selection
  const startDate =
    month === "all"
      ? new Date(currentYear, 0, 1) // January 1st of current year
      : new Date(currentYear, parseInt(month) - 1, 1); // First day of selected month

  const endDate =
    month === "all"
      ? new Date(currentYear + 1, 0, 1) // January 1st of next year
      : new Date(currentYear, parseInt(month), 0); // Last day of selected month

  const effectiveEndDate = endDate < today ? endDate : today;

  const where = {
    userId,
    date: {
      gte: startDate,
      lt: effectiveEndDate,
    },
  };

  const depositsTotal = Number(
    (
      await db.transaction.aggregate({
        where: {
          date: {
            gte: startDate,
            lt: effectiveEndDate,
          },
          type: TransactionType.DEPOSIT,
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

  const refundTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: TransactionType.REFUND },
        _sum: { amount: true },
      })
    )?._sum?.amount ?? 0,
  );

  const balance = depositsTotal - expensesTotal + refundTotal;

  const transactionsTotal = depositsTotal + expensesTotal + refundTotal;

  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: transactionsTotal
      ? Math.round((depositsTotal / transactionsTotal) * 100)
      : 0,
    [TransactionType.EXPENSE]: transactionsTotal
      ? Math.round((expensesTotal / transactionsTotal) * 100)
      : 0,
    [TransactionType.REFUND]: transactionsTotal
      ? Math.round((refundTotal / transactionsTotal) * 100)
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

  const isAdmin = await userAdmin();
  const lastTransactions = await db.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });
  const lastTransactionsDeposit = await db.transaction.findMany({
    where: {
      type: TransactionType.DEPOSIT,
    },
    orderBy: { date: "desc" },
  });

  return {
    balance,
    depositsTotal,
    expensesTotal,
    refundTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions: JSON.parse(
      JSON.stringify(
        lastTransactions.map((transaction) => ({
          ...transaction,
          lastTransactionsDeposit,
          amount:
            (transaction.type === TransactionType.DEPOSIT ||
              transaction.type === TransactionType.REFUND) &&
            transaction.status === TransactionStatus.WAITING &&
            !isAdmin
              ? 0
              : Number(transaction.amount),
        })),
      ),
    ),
  };
};
