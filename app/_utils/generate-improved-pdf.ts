// Arquivo COMPLETO com cabeçalho, resumo, tabelas, comprovantes e ajuste de imagem proporcional

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "../_lib/utils";
import {
  EXPENSE_CATEGORY_LABELS,
  BLOCK_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/app/_constants/transactions";
import type { AccountingBlock, Expense } from "@/app/types";
import type {
  BlockStatus,
  RequestStatus,
  ExpenseCategory,
} from "@prisma/client";

const COMPANY_CNPJS: Record<string, string> = {
  "GSM SOLARION 02": "44.910.546/0001-55",
  "CRIATIVA ENERGIA": "Não consta",
  "OESTE BIOGÁS": "41.106.939/0001-12",
  "EXATA I": "38.406.585/0001-17",
};

async function processImageForPDF(base64String: string): Promise<{
  base64: string;
  format: string;
  dimensions: { width: number; height: number };
} | null> {
  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const cleanBase64 = base64String.startsWith("data:")
        ? base64String
        : `data:image/jpeg;base64,${base64String}`;
      img.src = cleanBase64;

      img.onload = () => {
        const scaleFactor = 2; // aumenta a resolução

        const width = img.width * scaleFactor;
        const height = img.height * scaleFactor;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Erro ao criar contexto do canvas"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const processedBase64 = canvas.toDataURL("image/jpeg", 1.0); // Qualidade máxima

        resolve({
          base64: processedBase64,
          format: "JPEG",
          dimensions: { width, height },
        });
      };

      img.onerror = () => {
        console.warn("Erro ao carregar imagem, ignorando...");
        resolve(null);
      };
    });
  } catch (error) {
    console.warn("Erro ao processar imagem:", error);
    return null;
  }
}

function separateExpensesByType(expenses: Expense[]) {
  const despesas = expenses.filter((e) => e.type === "DESPESA");
  const caixa = expenses.filter((e) => e.type === "CAIXA");
  return { despesas, caixa };
}

function calculateTotals(expenses: Expense[]) {
  const { despesas, caixa } = separateExpensesByType(expenses);
  const totalDespesas = despesas.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCaixa = caixa.reduce((sum, e) => sum + Number(e.amount), 0);
  return { totalDespesas, totalCaixa, saldoFinal: totalCaixa - totalDespesas };
}

function normalizeDate(date: string | Date): string {
  return typeof date === "string" ? date : date.toISOString();
}

function getCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] || category;
}

function getBlockStatusLabel(status: BlockStatus): string {
  return BLOCK_STATUS_LABELS[status] || status;
}

function getRequestStatusLabel(status: RequestStatus): string {
  return REQUEST_STATUS_LABELS[status] || status;
}

export async function generateImprovedAccountingPDF(
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.warn("Logo não encontrada");
    }
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Relatório de Prestação de Contas",
      doc.internal.pageSize.width / 2,
      30,
      { align: "center" },
    );
  };

  // Página 1
  addHeader();
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA PRESTAÇÃO DE CONTAS", 15, 60);

  const yStart = 70;
  const lineHeight = 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const infoData = [
    ["Empresa:", companyName],
    ["CNPJ:", COMPANY_CNPJS[companyName] || "Não informado"],
    ["Responsável:", name],
    ["Código:", block.code],
    ["Data:", formatDate(normalizeDate(block.createdAt))],
  ];
  infoData.forEach(([label, value], index) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 15, yStart + index * lineHeight);
    doc.setFont("helvetica", "normal");
    doc.text(value, 50, yStart + index * lineHeight);
  });

  const bankingY = yStart + lineHeight * 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS BANCÁRIOS DO COLABORADOR", 15, bankingY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const bankingData = [
    `Banco: ${block.request?.bankName || "Não informado"}`,
    `Tipo: ${block.request?.accountType || "Não informado"}`,
    `Conta: ${block.request?.accountNumber || "Não informado"}`,
    `Titular: ${block.request?.accountHolderName || "Não informado"}`,
    `PIX: ${block.request?.pixKey || "Não informado"}`,
  ];
  bankingData.forEach((text, index) => {
    doc.text(text, 15, bankingY + 15 + index * 8);
  });

  const { despesas, caixa } = separateExpensesByType(block.expenses);
  const { totalDespesas, totalCaixa, saldoFinal } = calculateTotals(
    block.expenses,
  );
  const valorSolicitado = Number(block.request?.amount || 0);
  const summaryY = bankingY + 80;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DE FECHAMENTO", 15, summaryY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryData = [
    `Status do Bloco: ${getBlockStatusLabel(block.status)}`,
    `Status da Solicitação: ${getRequestStatusLabel(
      block.request?.status || "WAITING",
    )}`,
    `Valor Disponibilizado: ${formatCurrency(valorSolicitado)}`,
    `Total em Caixa: ${formatCurrency(totalCaixa)}`,
    `Total de Despesas: ${formatCurrency(totalDespesas)}`,
    `Saldo Final: ${formatCurrency(saldoFinal)}`,
  ];
  summaryData.forEach((text, index) => {
    doc.text(text, 15, summaryY + 15 + index * 8);
  });

  if (saldoFinal < 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 0, 0);
    doc.text(
      "REEMBOLSO NECESSÁRIO",
      15,
      summaryY + 15 + summaryData.length * 8 + 10,
    );
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  } else if (block.request?.status === "COMPLETED") {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 128, 0);
    doc.text("REEMBOLSADO", 15, summaryY + 15 + summaryData.length * 8 + 10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  }

  addFooter();

  // Página de despesas
  if (block.expenses.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHAMENTO DAS DESPESAS", 15, 30);
    let currentY = 50;

    if (caixa.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ENTRADAS DE CAIXA", 15, currentY);
      autoTable(doc, {
        startY: currentY + 10,
        head: [["Data", "Descrição", "Valor"]],
        body: caixa.map((e) => [
          formatDate(normalizeDate(e.date)),
          e.description || e.name || "Entrada de caixa",
          formatCurrency(Number(e.amount)),
        ]),
        headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 15, right: 15 },
      });
      currentY = doc.lastAutoTable.finalY + 20;
    }

    if (despesas.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DESPESAS", 15, currentY);
      autoTable(doc, {
        startY: currentY + 10,
        head: [["Data", "Categoria", "Valor", "Descrição"]],
        body: despesas.map((e) => [
          formatDate(normalizeDate(e.date)),
          getCategoryLabel(e.category),
          formatCurrency(Number(e.amount)),
          e.description || e.name || "",
        ]),
        headStyles: { fillColor: [220, 53, 69], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 15, right: 15, bottom: 40 },
        didDrawPage: () => addFooter(),
      });
    }
  }

  // Comprovantes
  for (const expense of despesas) {
    if (expense.imageUrls?.length) {
      for (const base64 of expense.imageUrls) {
        const processedImage = await processImageForPDF(base64);
        if (processedImage) {
          doc.addPage();
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          const margin = 20;
          const availableWidth = pageWidth - 2 * margin;
          const availableHeight = pageHeight - 120;
          const scaleX = availableWidth / processedImage.dimensions.width;
          const scaleY = availableHeight / processedImage.dimensions.height;
          const scale = Math.min(scaleX, scaleY, 1);
          const imgWidth = processedImage.dimensions.width * scale;
          const imgHeight = processedImage.dimensions.height * scale;
          const xPos = (pageWidth - imgWidth) / 2;
          const yPos = 40;

          doc.addImage(
            processedImage.base64,
            processedImage.format,
            xPos,
            yPos,
            imgWidth,
            imgHeight,
          );

          const textY = yPos + imgHeight + 20;
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
            `Categoria: ${getCategoryLabel(expense.category)}`,
            margin,
            textY + 16,
          );
          doc.text(
            `Valor: ${formatCurrency(Number(expense.amount))}`,
            margin,
            textY + 24,
          );
          doc.text(
            `Data: ${formatDate(normalizeDate(expense.date))}`,
            margin,
            textY + 32,
          );

          addFooter();
        }
      }
    }
  }

  return doc;
}
