"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { ExpenseCategory } from "@prisma/client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatExpenseCategory } from "@/app/_lib/utils";

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
  const { userId } = auth();
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
  const { userId } = auth();
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

export async function exportToExcel(
  startDate?: Date,
  endDate?: Date,
): Promise<Uint8Array | null> {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const [companyMetrics, expenseAnalytics] = await Promise.all([
    getCompanyMetrics(startDate, endDate),
    getExpenseAnalytics(startDate, endDate),
  ]);

  // Validate if we have data to export
  if (companyMetrics.length === 0 && expenseAnalytics.byCategory.length === 0) {
    return null;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Company Metrics Sheet - Add default row if empty
  const metricsData =
    companyMetrics.length > 0
      ? companyMetrics.map((metric) => ({
          Empresa: metric.company,
          "Total de Despesas": metric.totalExpenses,
          "Total de Solicitações": metric.totalRequests,
          "Blocos Abertos": metric.openBlocks,
        }))
      : [
          {
            Empresa: "Sem dados no período",
            "Total de Despesas": 0,
            "Total de Solicitações": 0,
            "Blocos Abertos": 0,
          },
        ];

  const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(wb, metricsSheet, "Métricas por Empresa");

  // Expense Analysis Sheet - Add default row if empty
  const analysisData =
    expenseAnalytics.byCategory.length > 0
      ? expenseAnalytics.byCategory.map((category) => ({
          Categoria: formatExpenseCategory(category.category),
          Valor: category.amount,
          Porcentagem: category.percentage,
        }))
      : [
          {
            Categoria: "Sem dados no período",
            Valor: 0,
            Porcentagem: 0,
          },
        ];

  const analysisSheet = XLSX.utils.json_to_sheet(analysisData);
  XLSX.utils.book_append_sheet(wb, analysisSheet, "Análise de Despesas");

  // Write to buffer with error handling
  try {
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new Uint8Array(excelBuffer);
  } catch (error) {
    console.error("Error generating Excel:", error);
    return null;
  }
}

export async function exportToPDF(
  startDate?: Date,
  endDate?: Date,
): Promise<Uint8Array | null> {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const [companyMetrics, expenseAnalytics] = await Promise.all([
    getCompanyMetrics(startDate, endDate),
    getExpenseAnalytics(startDate, endDate),
  ]);

  // Validate if we have data to export
  if (companyMetrics.length === 0 && expenseAnalytics.byCategory.length === 0) {
    return null;
  }

  try {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text("Relatório de Análise Financeira", 14, 15);

    // Period
    if (startDate && endDate) {
      doc.setFontSize(12);
      doc.text(
        `Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        14,
        25,
      );
    }

    // Company Metrics
    doc.setFontSize(14);
    doc.text("Métricas por Empresa", 14, 35);

    const metricsData =
      companyMetrics.length > 0
        ? companyMetrics.map((metric) => [
            metric.company,
            `R$ ${metric.totalExpenses.toFixed(2)}`,
            metric.totalRequests.toString(),
            metric.openBlocks.toString(),
          ])
        : [["Sem dados no período", "R$ 0,00", "0", "0"]];

    doc.autoTable({
      head: [
        [
          "Empresa",
          "Total de Despesas",
          "Total de Solicitações",
          "Blocos Abertos",
        ],
      ],
      body: metricsData,
      startY: 40,
    });

    // Expense Analysis
    doc.setFontSize(14);
    doc.text(
      "Análise de Despesas por Categoria",
      14,
      doc.lastAutoTable.finalY + 10,
    );

    const analysisData =
      expenseAnalytics.byCategory.length > 0
        ? expenseAnalytics.byCategory.map((category) => [
            formatExpenseCategory(category.category),
            `R$ ${category.amount.toFixed(2)}`,
            `${category.percentage.toFixed(2)}%`,
          ])
        : [["Sem dados no período", "R$ 0,00", "0%"]];

    doc.autoTable({
      head: [["Categoria", "Valor", "Porcentagem"]],
      body: analysisData,
      startY: doc.lastAutoTable.finalY + 15,
    });

    return new Uint8Array(doc.output("arraybuffer"));
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}
