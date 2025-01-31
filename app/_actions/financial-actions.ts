"use server";

import { db } from "@/app/_lib/prisma";

export async function getApprovedValues() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const approvedRequests = await db.request.findMany({
      where: {
        OR: [{ status: "ACCEPTS" }, { status: "COMPLETED" }],
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    console.log("Raw approved requests:", approvedRequests);

    // Get all months in the last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString("pt-BR", { month: "short" }).toLowerCase();
    }).reverse();

    // Initialize monthlyTotals with all months set to 0
    const monthlyTotals = months.reduce(
      (acc, month) => {
        acc[month] = 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Sum up the values for each month
    approvedRequests.forEach((request) => {
      const month = request.createdAt
        .toLocaleString("pt-BR", { month: "short" })
        .toLowerCase();
      monthlyTotals[month] =
        (monthlyTotals[month] || 0) + Number(request.amount);
    });

    // Convert to array format
    const formattedData = Object.entries(monthlyTotals).map(
      ([month, value]) => ({
        month,
        value,
      }),
    );

    console.log("Formatted approved values:", formattedData);
    return formattedData;
  } catch (error) {
    console.error("Error in getApprovedValues:", error);
    return [];
  }
}

export async function getExpensesByCategory() {
  try {
    const expenses = await db.expense.groupBy({
      by: ["category"],
      _sum: {
        amount: true,
      },
      where: {
        OR: [{ status: "APPROVED" }, { status: "WAITING" }],
      },
    });

    console.log("Raw expenses data:", expenses);

    const formattedData = expenses
      .map((expense) => ({
        category: formatExpenseCategory(expense.category),
        value: Number(expense._sum.amount) || 0,
      }))
      .filter((item) => item.value > 0);

    console.log("Formatted expenses data:", formattedData);
    return formattedData;
  } catch (error) {
    console.error("Error in getExpensesByCategory:", error);
    return [];
  }
}

function formatExpenseCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    FOODANDBEVERAGE: "Alimentação",
    ACCOMMODATION: "Hospedagem",
    TOLL: "Pedágio",
    FREIGHT: "Frete",
    POSTAGE: "Correios",
    PRINTING: "Impressão",
    FUEL: "Combustível",
    VEHICLERENTAL: "Aluguel de Veículo",
    TICKET: "Passagem",
    AIRTICKET: "Passagem Aérea",
    BUSTICKET: "Passagem Ônibus",
    VEHICLEWASH: "Lavagem",
    ADVANCE: "Adiantamento",
    SUPPLIES: "Suprimentos",
    OTHER: "Outros",
  };
  return categoryMap[category] || category;
}

export async function getFinancialOverviewData() {
  try {
    const [approvedValues, expensesByCategory] = await Promise.all([
      getApprovedValues(),
      getExpensesByCategory(),
    ]);

    console.log("Financial overview data:", {
      approvedValues,
      expensesByCategory,
    });

    return {
      approvedValues,
      expensesByCategory,
    };
  } catch (error) {
    console.error("Error in getFinancialOverviewData:", error);
    return {
      approvedValues: [],
      expensesByCategory: [],
    };
  }
}
