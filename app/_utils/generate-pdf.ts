// generate-pdf.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Decimal } from "@prisma/client/runtime/library";
import { formatCurrency, formatDate } from "../_lib/utils";
import {
  EXPENSE_CATEGORY_LABELS,
  BLOCK_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/app/_constants/transactions";
import type { Expense } from "@/app/types/expense";
import { type BlockStatus, RequestStatus } from "@prisma/client";

interface AccountingBlock {
  code: string;
  createdAt: string | Date;
  status: BlockStatus;
  initialAmount?: number | Decimal;
  expenses: Expense[];
  request?: {
    status: RequestStatus;
    amount: number | Decimal;
    bankName?: string | null;
    accountType?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
    pixKey?: string | null;
  };
}

const COMPANY_CNPJS: Record<string, string> = {
  "GSM SOLARION 02": "44.910.546/0001-55",
  "CRIATIVA ENERGIA": "Não consta",
  "OESTE BIOGÁS": "41.106.939/0001-12",
  "EXATA I": "38.406.585/0001-17",
};

function getBase64ImageFormat(base64String: string): string {
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? match[1].toUpperCase() : "PNG";
}

function cleanBase64String(base64String: string): string {
  return base64String.replace(/^data:image\/\w+;base64,/, "");
}

async function normalizeBase64Image(base64Data: string): Promise<{
  base64: string;
  dimensions: { width: number; height: number };
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Data;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Erro ao criar contexto do canvas"));
        return;
      }

      const maxWidth = 600;
      const maxHeight = 600;
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const normalizedBase64 = canvas.toDataURL();
      resolve({
        base64: normalizedBase64,
        dimensions: { width, height },
      });
    };

    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
  });
}

function calculateExpensesByCategory(
  expenses: Expense[],
): Record<string, number> {
  return expenses.reduce(
    (acc, expense) => {
      const label = EXPENSE_CATEGORY_LABELS[expense.category];
      acc[label] = (acc[label] || 0) + Number(expense.amount.toString());
      return acc;
    },
    {} as Record<string, number>,
  );
}

export async function generateAccountingPDF(
  block: AccountingBlock,
  companyName: string,
  name: string,
) {
  const doc = new jsPDF();
  let pageNumber = 1;

  const addFooter = () => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `© ${new Date().getFullYear()} Criativa Energia`,
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" },
    );
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Página ${pageNumber}`, pageWidth - 20, pageHeight - 10);
    pageNumber++;
  };

  const addHeader = () => {
    try {
      doc.addImage("/logo.png", "PNG", 15, 15, 40, 25);
    } catch (e) {
      console.warn("Logo não encontrada", e);
    }
    doc.setFontSize(18);
    doc.text(
      "Relatório de Prestação de Contas",
      doc.internal.pageSize.width / 2,
      30,
      {
        align: "center",
      },
    );
  };

  addHeader();

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA PRESTAÇÃO DE CONTAS", 15, 60);

  const yStart = 70;
  const lineHeight = 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(companyName, 50, yStart);
  doc.text(
    COMPANY_CNPJS[companyName] || "Não informado",
    50,
    yStart + lineHeight,
  );
  doc.text(name, 50, yStart + lineHeight * 2);
  doc.text(block.code, 50, yStart + lineHeight * 3);
  doc.text(formatDate(block.createdAt), 50, yStart + lineHeight * 4);

  doc.setFont("helvetica", "bold");
  doc.text("Empresa:", 15, yStart);
  doc.text("CNPJ:", 15, yStart + lineHeight);
  doc.text("Responsável:", 15, yStart + lineHeight * 2);
  doc.text("Código:", 15, yStart + lineHeight * 3);
  doc.text("Data:", 15, yStart + lineHeight * 4);

  const bankingY = yStart + lineHeight * 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS BANCÁRIOS DO COLABORADOR", 15, bankingY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Banco: ${block.request?.bankName || "Não informado"}`,
    15,
    bankingY + 15,
  );
  doc.text(
    `Tipo: ${block.request?.accountType || "Não informado"}`,
    15,
    bankingY + 23,
  );
  doc.text(
    `Conta: ${block.request?.accountNumber || "Não informado"}`,
    15,
    bankingY + 31,
  );
  doc.text(
    `Titular: ${block.request?.accountHolderName || "Não informado"}`,
    15,
    bankingY + 39,
  );
  doc.text(
    `PIX: ${block.request?.pixKey || "Não informado"}`,
    15,
    bankingY + 47,
  );

  const summaryY = bankingY + 60;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DE FECHAMENTO", 15, summaryY);

  const totalExpenses = block.expenses.reduce(
    (t, e) => t + Number(e.amount.toString()),
    0,
  );
  const initialAmount = Number(block.initialAmount?.toString() || 0);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Status do Bloco: ${BLOCK_STATUS_LABELS[block.status]}`,
    15,
    summaryY + 15,
  );
  doc.text(
    `Status da Solicitação: ${REQUEST_STATUS_LABELS[block.request?.status || RequestStatus.WAITING]}`,
    15,
    summaryY + 23,
  );
  doc.text(
    `Valor solicitado: ${formatCurrency(Number(block.request?.amount || 0))}`,
    15,
    summaryY + 31,
  );
  doc.text(
    `Total despesas: ${formatCurrency(totalExpenses)}`,
    15,
    summaryY + 39,
  );

  addFooter();

  if (block.expenses.length > 0) {
    doc.addPage();
    pageNumber = 1;
    const expensesByCategory = calculateExpensesByCategory(block.expenses);
    autoTable(doc, {
      startY: 30,
      head: [["CATEGORIA", "VALOR"]],
      body: Object.entries(expensesByCategory).map(([cat, val]) => [
        cat,
        formatCurrency(val),
      ]),
      headStyles: {
        fillColor: [26, 132, 53],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: { 1: { halign: "right" } },
      styles: { fontSize: 11, cellPadding: 4 },
      margin: { left: 15, right: 15 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Data", "Categoria", "Valor", "Descrição"]],
      body: block.expenses.map((e) => [
        formatDate(e.date),
        EXPENSE_CATEGORY_LABELS[e.category],
        formatCurrency(Number(e.amount)),
        e.description,
      ]),
      headStyles: {
        fillColor: [26, 132, 53],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25, halign: "right" },
        3: { cellWidth: "auto" },
      },
      margin: { left: 15, right: 15, bottom: 40 },
      didDrawPage: () => addFooter(),
    });
  }

  for (const expense of block.expenses) {
    if (expense.imageUrls?.length) {
      for (const base64 of expense.imageUrls) {
        try {
          const { base64: normalized, dimensions } =
            await normalizeBase64Image(base64);
          const clean = cleanBase64String(normalized);
          let format = getBase64ImageFormat(normalized);
          if (format === "JPG") format = "JPEG";

          doc.addPage();
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          const margin = 20;
          const availableWidth = pageWidth - 2 * margin;
          const availableHeight = pageHeight - 100;

          const scale = Math.min(
            availableWidth / dimensions.width,
            availableHeight / dimensions.height,
          );
          const imgWidth = dimensions.width * scale;
          const imgHeight = dimensions.height * scale;
          const xPos = (pageWidth - imgWidth) / 2;
          const yPos = 30;

          doc.addImage(clean, format, xPos, yPos, imgWidth, imgHeight);

          const textY = yPos + imgHeight + 15;
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Despesa: ${expense.name || "Sem nome"}`, margin, textY);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Descrição: ${expense.description || "-"}`,
            margin,
            textY + 8,
          );
          doc.text(
            `Categoria: ${EXPENSE_CATEGORY_LABELS[expense.category]}`,
            margin,
            textY + 16,
          );
          doc.text(
            `Valor: ${formatCurrency(Number(expense.amount))}`,
            margin,
            textY + 24,
          );
          doc.text(`Data: ${formatDate(expense.date)}`, margin, textY + 32);

          addFooter();
        } catch (error) {
          console.error("Erro ao processar imagem para o PDF:", error);
        }
      }
    }
  }

  return doc;
}
