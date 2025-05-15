"use server";

import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { ExpenseCategory } from "@prisma/client";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatExpenseCategory } from "@/app/_lib/utils";
import autoTable from "jspdf-autotable";

// Extend jsPDF with autoTable types
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: {
      head: string[][];
      body: string[][];
      startY: number;
    }) => void;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface CompanyMetrics {
  company: string;
  totalExpenses: number;
  totalRequests: number;
  openBlocks: number;
  categories: {
    category: ExpenseCategory;
    amount: number;
  }[];
}

export interface ExpenseAnalytics {
  totalAmount: number;
  byCategory: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  }[];
  byCompany: {
    company: string;
    amount: number;
    percentage: number;
  }[];
  trends: {
    month: string;
    amount: number;
  }[];
}

export async function getCompanyMetrics(
  startDate?: Date,
  endDate?: Date,
): Promise<CompanyMetrics[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dateFilter = {
    ...(startDate && endDate
      ? {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {}),
  };

  const companies = await db.expense.groupBy({
    by: ["company"],
    _sum: {
      amount: true,
    },
    where: dateFilter,
  });

  const metrics = await Promise.all(
    companies.map(async (company) => {
      const [expenses, requests, blocks, categories] = await Promise.all([
        db.expense.aggregate({
          where: { company: company.company, ...dateFilter },
          _sum: { amount: true },
        }),
        db.request.count({
          where: { responsibleCompany: company.company, ...dateFilter },
        }),
        db.accountingBlock.count({
          where: { company: company.company, status: "OPEN", ...dateFilter },
        }),
        db.expense.groupBy({
          by: ["category"],
          _sum: { amount: true },
          where: { company: company.company, ...dateFilter },
        }),
      ]);

      return {
        company: company.company,
        totalExpenses: expenses._sum.amount?.toNumber() ?? 0,
        totalRequests: requests,
        openBlocks: blocks,
        categories: categories.map((cat) => ({
          category: cat.category,
          amount: cat._sum.amount?.toNumber() ?? 0,
        })),
      };
    }),
  );

  return metrics;
}

export async function getExpenseAnalytics(
  startDate?: Date,
  endDate?: Date,
): Promise<ExpenseAnalytics> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dateFilter = {
    ...(startDate && endDate
      ? {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {}),
  };

  const [total, byCategory, byCompany, trends] = await Promise.all([
    db.expense.aggregate({
      where: dateFilter,
      _sum: { amount: true },
    }),
    db.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      where: dateFilter,
    }),
    db.expense.groupBy({
      by: ["company"],
      _sum: { amount: true },
      where: dateFilter,
    }),
    db.$queryRaw<{ month: string; amount: number }[]>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        SUM(amount) as amount
      FROM "Expense"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `,
  ]);

  const totalAmount = total._sum.amount?.toNumber() ?? 0;

  return {
    totalAmount,
    byCategory: byCategory.map((cat) => ({
      category: cat.category,
      amount: cat._sum.amount?.toNumber() ?? 0,
      percentage: ((cat._sum.amount?.toNumber() ?? 0) / totalAmount) * 100,
    })),
    byCompany: byCompany.map((comp) => ({
      company: comp.company,
      amount: comp._sum.amount?.toNumber() ?? 0,
      percentage: ((comp._sum.amount?.toNumber() ?? 0) / totalAmount) * 100,
    })),
    trends: trends.map((trend) => ({
      month: trend.month,
      amount: Number(trend.amount),
    })),
  };
}

export async function exportToPDF(
  startDate?: Date,
  endDate?: Date,
): Promise<Uint8Array | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const [companyMetrics, expenseAnalytics] = await Promise.all([
      getCompanyMetrics(startDate, endDate),
      getExpenseAnalytics(startDate, endDate),
    ]);

    // Validate if we have data to export
    if (
      companyMetrics.length === 0 &&
      expenseAnalytics.byCategory.length === 0
    ) {
      return null;
    }

    // Create PDF document with explicit encoding
    const doc = new jsPDF({ filters: ["ASCIIHexEncode"] });

    try {
      // Get user information
      const user = await (await clerkClient()).users.getUser(userId);
      const responsibleName = `${user.firstName} ${user.lastName}`;

      // Basic document setup
      doc.setFont("helvetica");

      // Header
      doc.setFontSize(20);
      doc.text("Criativa", doc.internal.pageSize.width / 2, 20, {
        align: "center",
      });

      // Report info
      doc.setFontSize(16);
      doc.text("Relatório de Análise Financeira", 14, 35);

      doc.setFontSize(12);
      doc.text(`Responsável: ${responsibleName}`, 14, 45);

      if (startDate && endDate) {
        doc.text(
          `Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          14,
          52,
        );
      }

      // Company Metrics Table
      const metricsData = companyMetrics.map((metric) => [
        metric.company,
        `R$ ${metric.totalExpenses.toFixed(2)}`,
        metric.totalRequests.toString(),
        metric.openBlocks.toString(),
      ]);

      autoTable(doc, {
        startY: 60,
        head: [
          [
            "Empresa",
            "Total de Despesas",
            "Total de Solicitações",
            "Blocos Abertos",
          ],
        ],
        body: metricsData,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
      });

      // Categories Table
      const categoriesData = expenseAnalytics.byCategory.map((category) => [
        formatExpenseCategory(category.category),
        `R$ ${category.amount.toFixed(2)}`,
        `${category.percentage.toFixed(2)}%`,
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Categoria", "Valor", "Porcentagem"]],
        body: categoriesData,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
      });

      // Convert to Uint8Array directly from the arraybuffer
      const pdfBuffer = doc.output("arraybuffer");
      return new Uint8Array(pdfBuffer);
    } catch (innerError) {
      console.error("Error during PDF generation:", innerError);
      throw new Error("Erro na geração do PDF");
    }
  } catch (error) {
    console.error("Error in exportToPDF:", error);
    return null;
  }
}
