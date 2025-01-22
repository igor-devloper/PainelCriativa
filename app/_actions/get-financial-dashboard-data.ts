"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { STATUS_BLOCK_LABEL } from "../types/block";
import { EXPENSE_CATEGORY_LABELS } from "../_constants/transactions";

export interface FinancialDashboardData {
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingRequestsAmount: number;
  };
  expensesByCompany: {
    company: string;
    amount: number;
  }[];
  cashFlowData: {
    date: string;
    income: number;
    expenses: number;
  }[];
  pendingRequests: {
    id: string;
    name: string;
    amount: number;
    date: string;
  }[];
  recentAccountingBlocks: {
    id: string;
    code: string;
    company: string;
    amount: number;
    status: string;
  }[];
  expensesByCategory: {
    category: string;
    amount: number;
  }[];
}

export async function getFinancialDashboardData(): Promise<FinancialDashboardData> {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const currentDate = new Date();
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  const endOfYear = new Date(currentDate.getFullYear(), 11, 31);

  const [
    totalRevenue,
    totalExpenses,
    expensesByCompany,
    cashFlowData,
    pendingRequests,
    recentAccountingBlocks,
    expensesByCategory,
  ] = await Promise.all([
    // Total Revenue
    db.request.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    }),

    // Total Expenses
    db.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    }),

    // Expenses by Company
    db.expense.groupBy({
      by: ["company"],
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    }),

    // Cash Flow Data
    db.$queryRaw<{ date: Date; income: number; expenses: number }[]>`
      SELECT 
        DATE_TRUNC('month', "createdAt") as date,
        SUM(CASE WHEN "status" = 'COMPLETED' THEN "amount" ELSE 0 END) as income,
        0 as expenses
      FROM "Request"
      WHERE "createdAt" BETWEEN ${startOfYear} AND ${endOfYear}
      GROUP BY DATE_TRUNC('month', "createdAt")
      UNION ALL
      SELECT 
        DATE_TRUNC('month', "createdAt") as date,
        0 as income,
        SUM("amount") as expenses
      FROM "Expense"
      WHERE "createdAt" BETWEEN ${startOfYear} AND ${endOfYear}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY date
    `,

    // Pending Requests
    db.request.findMany({
      where: {
        status: "WAITING",
      },
      select: {
        id: true,
        name: true,
        amount: true,
        createdAt: true,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    }),

    // Recent Accounting Blocks
    db.accountingBlock.findMany({
      select: {
        id: true,
        code: true,
        company: true,
        initialAmount: true,
        status: true,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    }),

    // Expenses by Category
    db.expense.groupBy({
      by: ["category"],
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    }),
  ]);

  const totalRevenueAmount = totalRevenue._sum.amount?.toNumber() ?? 0;
  const totalExpensesAmount = totalExpenses._sum.amount?.toNumber() ?? 0;

  // Process cash flow data
  const processedCashFlowData = cashFlowData.reduce<
    Record<string, { income: number; expenses: number }>
  >((acc, item) => {
    const dateKey = item.date.toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = { income: 0, expenses: 0 };
    }
    acc[dateKey].income += Number(item.income);
    acc[dateKey].expenses += Number(item.expenses);
    return acc;
  }, {});

  const formattedCashFlowData = Object.entries(processedCashFlowData).map(
    ([date, data]) => ({
      date,
      income: data.income,
      expenses: data.expenses,
    }),
  );

  return {
    metrics: {
      totalRevenue: totalRevenueAmount,
      totalExpenses: totalExpensesAmount,
      netProfit: totalRevenueAmount - totalExpensesAmount,
      pendingRequestsAmount: pendingRequests.reduce(
        (sum, request) => sum + request.amount.toNumber(),
        0,
      ),
    },
    expensesByCompany: expensesByCompany.map((expense) => ({
      company: expense.company,
      amount: expense._sum.amount?.toNumber() ?? 0,
    })),
    cashFlowData: formattedCashFlowData,
    pendingRequests: pendingRequests.map((request) => ({
      id: request.id,
      name: request.name,
      amount: request.amount.toNumber(),
      date: request.createdAt.toISOString(),
    })),
    recentAccountingBlocks: recentAccountingBlocks.map((block) => ({
      id: block.id,
      code: block.code,
      company: block.company,
      amount: block.initialAmount.toNumber(),
      status: STATUS_BLOCK_LABEL[block.status],
    })),
    expensesByCategory: expensesByCategory.map((expense) => ({
      category: EXPENSE_CATEGORY_LABELS[expense.category],
      amount: expense._sum.amount?.toNumber() ?? 0,
    })),
  };
}
