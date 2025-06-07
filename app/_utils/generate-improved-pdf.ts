/* eslint-disable @typescript-eslint/no-unused-vars */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "../_lib/utils";
import {
  EXPENSE_CATEGORY_LABELS,
  BLOCK_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/app/_constants/transactions";
import type { AccountingBlock, Expense } from "@/app/types";
import type { BlockStatus, RequestStatus, ExpenseCategory } from "@/app/types";

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
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Erro ao criar contexto do canvas"));
          return;
        }

        // Definir tamanhos máximos mantendo proporção
        const maxWidth = 400;
        const maxHeight = 400;
        let { width, height } = img;

        // Calcular escala mantendo proporção
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY); // Usar a menor escala para manter proporção

        // Aplicar escala apenas se necessário (se a imagem for maior que o máximo)
        if (scale < 1) {
          width = width * scale;
          height = height * scale;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const processedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        const cleanProcessed = processedBase64.replace(
          /^data:image\/\w+;base64,/,
          "",
        );

        resolve({
          base64: cleanProcessed,
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

  const totalDespesas = despesas.reduce((sum, e) => {
    const amount =
      typeof e.amount === "number" ? e.amount : Number(e.amount.toString());
    return sum + amount;
  }, 0);

  const totalCaixa = caixa.reduce((sum, e) => {
    const amount =
      typeof e.amount === "number" ? e.amount : Number(e.amount.toString());
    return sum + amount;
  }, 0);

  return { totalDespesas, totalCaixa };
}

// Função para normalizar datas
function normalizeDate(date: string | Date): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date;
}

// Função para obter label segura das categorias
function getCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] || category;
}

// Função para obter label segura dos status
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

  // Página 1: Informações gerais
  addHeader();

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA PRESTAÇÃO DE CONTAS", 15, 60);

  const yStart = 70;
  const lineHeight = 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Dados da empresa e responsável
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

  // Dados bancários
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

  // Resumo melhorado - CORRIGIDO
  const { despesas, caixa } = separateExpensesByType(block.expenses);
  const { totalDespesas, totalCaixa } = calculateTotals(block.expenses);
  const valorSolicitado = block.request?.amount
    ? typeof block.request.amount === "number"
      ? block.request.amount
      : Number(block.request.amount.toString())
    : 0;

  // CORREÇÃO: Lógica correta do saldo final
  // Saldo Final = (Valor Disponibilizado + Total Caixa) - Total de Despesas
  const saldoFinal = valorSolicitado + totalCaixa - totalDespesas;

  const summaryY = bankingY + 80;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DE FECHAMENTO", 15, summaryY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryData = [
    `Status do Bloco: ${getBlockStatusLabel(block.status)}`,
    `Status da Solicitação: ${getRequestStatusLabel(block.request?.status || "WAITING")}`,
    `Valor Disponibilizado: ${formatCurrency(valorSolicitado)}`,
    `Total em Caixa: ${formatCurrency(totalCaixa)}`,
    `Total de Despesas: ${formatCurrency(totalDespesas)}`,
    `Saldo Final: ${formatCurrency(saldoFinal)}`,
  ];

  summaryData.forEach((text, index) => {
    doc.text(text, 15, summaryY + 15 + index * 8);
  });

  // Indicar se foi reembolsado - CORRIGIDO
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
    doc.text("SALDO POSITIVO", 15, summaryY + 15 + summaryData.length * 8 + 10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  }

  addFooter();

  // Página 2: Apenas despesas (separadas por tipo)
  if (block.expenses.length > 0) {
    doc.addPage();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHAMENTO DAS DESPESAS", 15, 30);

    let currentY = 50;

    // Seção de Caixa
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
          formatCurrency(
            typeof e.amount === "number"
              ? e.amount
              : Number(e.amount.toString()),
          ),
        ]),
        headStyles: {
          fillColor: [0, 128, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 100 },
          2: { cellWidth: 30, halign: "right" },
        },
        margin: { left: 15, right: 15 },
      });

      currentY = doc.lastAutoTable.finalY + 20;
    }

    // Seção de Despesas
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
          formatCurrency(
            typeof e.amount === "number"
              ? e.amount
              : Number(e.amount.toString()),
          ),
          e.description || e.name || "",
        ]),
        headStyles: {
          fillColor: [220, 53, 69],
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
  }

  // Páginas de comprovantes (apenas para despesas)
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
          const availableHeight = pageHeight - 120; // Mais espaço para texto

          // Calcular escala mantendo proporção
          const scaleX = availableWidth / processedImage.dimensions.width;
          const scaleY = availableHeight / processedImage.dimensions.height;
          const scale = Math.min(scaleX, scaleY, 1); // Não aumentar imagens pequenas

          const imgWidth = processedImage.dimensions.width * scale;
          const imgHeight = processedImage.dimensions.height * scale;

          // Centralizar a imagem
          const xPos = (pageWidth - imgWidth) / 2;
          const yPos = 40; // Posição fixa do topo

          try {
            doc.addImage(
              processedImage.base64,
              processedImage.format,
              xPos,
              yPos,
              imgWidth,
              imgHeight,
            );

            // Informações da despesa abaixo da imagem
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
              `Valor: ${formatCurrency(typeof expense.amount === "number" ? expense.amount : Number(expense.amount.toString()))}`,
              margin,
              textY + 24,
            );
            doc.text(
              `Data: ${formatDate(normalizeDate(expense.date))}`,
              margin,
              textY + 32,
            );

            addFooter();
          } catch (error) {
            console.error("Erro ao adicionar imagem ao PDF:", error);
          }
        }
      }
    }
  }

  return doc;
}
