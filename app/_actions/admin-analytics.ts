/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { ExpenseCategory } from "@prisma/client";
import Excel from "exceljs";
import { PDFDocument, rgb } from "pdf-lib";

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
): Promise<Uint8Array> {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const [companyMetrics, expenseAnalytics] = await Promise.all([
    getCompanyMetrics(startDate, endDate),
    getExpenseAnalytics(startDate, endDate),
  ]);

  const workbook = new Excel.Workbook();

  // Métricas por Empresa
  const metricsSheet = workbook.addWorksheet("Métricas por Empresa");
  metricsSheet.columns = [
    { header: "Empresa", key: "company", width: 30 },
    { header: "Total de Despesas", key: "expenses", width: 20 },
    { header: "Total de Solicitações", key: "requests", width: 20 },
    { header: "Blocos Abertos", key: "blocks", width: 20 },
  ];

  companyMetrics.forEach((metric) => {
    metricsSheet.addRow({
      company: metric.company,
      expenses: metric.totalExpenses,
      requests: metric.totalRequests,
      blocks: metric.openBlocks,
    });
  });

  // Análise de Despesas
  const analysisSheet = workbook.addWorksheet("Análise de Despesas");
  analysisSheet.columns = [
    { header: "Categoria", key: "category", width: 30 },
    { header: "Valor", key: "amount", width: 20 },
    { header: "Porcentagem", key: "percentage", width: 20 },
  ];

  expenseAnalytics.byCategory.forEach((category) => {
    analysisSheet.addRow({
      category: category.category,
      amount: category.amount,
      percentage: `${category.percentage.toFixed(2)}%`,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

export async function exportToPDF(
  startDate?: Date,
  endDate?: Date,
): Promise<Uint8Array> {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const [companyMetrics, expenseAnalytics] = await Promise.all([
    getCompanyMetrics(startDate, endDate),
    getExpenseAnalytics(startDate, endDate),
  ]);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height, width } = page.getSize();

  let yOffset = height - 50;

  // Title
  page.drawText("Relatório de Análise Financeira", {
    x: 50,
    y: yOffset,
    size: 20,
    color: rgb(0, 0, 0),
  });

  yOffset -= 40;

  // Company Metrics
  page.drawText("Métricas por Empresa", {
    x: 50,
    y: yOffset,
    size: 16,
    color: rgb(0, 0, 0),
  });

  yOffset -= 20;

  companyMetrics.forEach((metric) => {
    yOffset -= 20;
    page.drawText(`${metric.company}: R$ ${metric.totalExpenses.toFixed(2)}`, {
      x: 50,
      y: yOffset,
      size: 12,
      color: rgb(0, 0, 0),
    });
  });

  yOffset -= 40;

  // Expense Analysis
  page.drawText("Análise de Despesas por Categoria", {
    x: 50,
    y: yOffset,
    size: 16,
    color: rgb(0, 0, 0),
  });

  yOffset -= 20;

  expenseAnalytics.byCategory.forEach((category) => {
    yOffset -= 20;
    page.drawText(
      `${category.category}: R$ ${category.amount.toFixed(2)} (${category.percentage.toFixed(2)}%)`,
      {
        x: 50,
        y: yOffset,
        size: 12,
        color: rgb(0, 0, 0),
      },
    );
  });

  return await pdfDoc.save();
}
