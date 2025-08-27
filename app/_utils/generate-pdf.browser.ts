"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "../_lib/utils";
import { AccountingBlock, ExpenseItem } from "../types";
import {
  EXPENSE_CATEGORY_LABELS,
  BLOCK_STATUS_LABELS,
} from "@/app/_constants/transactions";

// helpers específicos do browser
function dataUrlFormat(d: string): "PNG" | "JPEG" {
  const m = d.match(/^data:image\/(\w+);base64,/i);
  return m && /jpe?g/i.test(m[1]) ? "JPEG" : "PNG";
}
const stripDataUrl = (s: string) => s.replace(/^data:image\/\w+;base64,/, "");

function safeNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && (value as any).toString) {
    const parsed = Number.parseFloat((value as any).toString());
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

const COMPANY_CNPJS: Record<string, string> = {
  "GSM SOLARION 02": "44.910.546/0001-55",
  "CRIATIVA ENERGIA": "Não consta",
  "OESTE BIOGÁS": "41.106.939/0001-12",
  "EXATA I": "38.406.585/0001-17",
};

// carrega /logo.png e converte via canvas
async function loadLogoAsDataURL(url = "/logo.png") {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("canvas ctx null"));
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("logo load error"));
    img.src = url;
  });
}

function calculateTotals(expenses: any[]) {
  const despesas = expenses.filter((e) => e.type === "DESPESA");
  const caixa = expenses.filter((e) => e.type === "CAIXA");
  const totalDespesas = despesas.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCaixa = caixa.reduce((sum, e) => sum + Number(e.amount), 0);
  return { totalDespesas, totalCaixa };
}

function calculateExpensesByCategory(expenses: ExpenseItem[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const categoryLabel = EXPENSE_CATEGORY_LABELS[expense.category];
    acc[categoryLabel] = (acc[categoryLabel] || 0) + Number(expense.amount.toString());
    return acc;
  }, {} as Record<string, number>);
}

function safe(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

export async function generateAccountingPDFBrowser(
  block: AccountingBlock,
  companyName: string,
  name: string
) {
  const doc = new jsPDF();

  const logoDataURL = await loadLogoAsDataURL("/logo.png");
  const { totalDespesas, totalCaixa } = calculateTotals(block.expenses);

  const addHeader = () => {
    const logoHeight = 30;
    const logoWidth = logoHeight * (453 / 551);
    doc.setFontSize(20);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(10, 10, doc.internal.pageSize.width - 20, 30, 3, 3, "F");
    doc.addImage(logoDataURL, "PNG", 10, 10, logoWidth, logoHeight, undefined, "FAST");
    doc.setTextColor(0, 0, 0);
    doc.text("Relatório de Prestação de Contas", doc.internal.pageSize.width / 2, 28, { align: "center" });
  };

  const addFooter = (pageNumber: number) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(26, 132, 53);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 25, pageWidth - 10, pageHeight - 25);
    const logoHeight = 25;
    const logoWidth = logoHeight * (453 / 551);
    doc.addImage(logoDataURL, "PNG", 10, pageHeight - 24, logoWidth, logoHeight, undefined, "FAST");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const currentYear = new Date().getFullYear();
    const copyrightText = `© ${currentYear} Criativa Energia. Todos os direitos reservados. Este documento é confidencial e contém informações proprietárias.`;
    doc.text(copyrightText, pageWidth / 2, pageHeight - 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Página ${pageNumber}`, pageWidth - 20, pageHeight - 10);
  };

  /* ---- Página 1 */
  addHeader();

  const companyCNPJ = COMPANY_CNPJS[companyName] || "";

  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, 50, doc.internal.pageSize.width - 20, 60, 3, 3, "F");

  autoTable(doc, {
    startY: 55,
    head: [["DADOS DA PRESTAÇÃO DE CONTAS", "", "", ""]],
    body: [
      ["Empresa:", companyName],
      ["CNPJ:", companyCNPJ],
      ["Responsável:", name],
      ["Código:", block.code],
      ["Data:", formatDate(block.createdAt)],
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold" } },
    headStyles: { fillColor: [26, 132, 53], textColor: [255, 255, 255], fontStyle: "bold" },
    margin: { left: 15 },
  });

  // Dados bancários
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, 115, 190, 70, 3, 3, "F");

  autoTable(doc, {
    startY: 120,
    head: [["DADOS BANCÁRIOS DO COLABORADOR"]],
    body: [
      [`Banco: ${block.request?.bankName || "Não informado"}`],
      [`Tipo de Conta: ${block.request?.accountType || "Não informado"}`],
      [`Número da Conta: ${block.request?.accountNumber || "Não informado"}`],
      [`Titular: ${block.request?.accountHolderName || "Não informado"}`],
      [`Chave PIX: ${block.request?.pixKey || "Não informado"}`],
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 3 },
    headStyles: { fillColor: [26, 132, 53], textColor: [255, 255, 255], fontStyle: "bold" },
    margin: { left: 15, right: 15 },
  });

  // Resumo financeiro
  const reembolso = block.expenses.filter((e: any) => e.type === "REEMBOLSO");
  const totalExpenses = block.expenses.reduce(
    (total: number, expense: any) => total + Number(expense.amount.toString()),
    0
  );
  const totalReembolso = reembolso.reduce((sum: number, e: any) => sum + safeNumber(e.amount), 0);

  const remainingBalance =
    (Number(block.initialAmount?.toString()) + totalCaixa + totalReembolso) - totalExpenses;

  const expensesByCategory = calculateExpensesByCategory(block.expenses);

  const statusY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : 200;

  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, statusY, 190, 70, 3, 3, "F");
  const rembolsoNecessario = remainingBalance < 0 ? "Reembolso necessário" : "Reembolso feito";

  autoTable(doc, {
    startY: statusY + 5,
    head: [["RESUMO DE FECHAMENTO", "", "", "", ""]],
    body: [
      ["Status da Prestação de Contas:", BLOCK_STATUS_LABELS[block.status]],
      ["Valor disponibilizado:", formatCurrency(Number(block.request?.amount?.toString()))],
      ["Total das despesas:", formatCurrency(totalExpenses)],
      ["Total em caixa:", formatCurrency(totalCaixa)],
      ["Reembolso:", rembolsoNecessario],
      ["Saldo final:", formatCurrency(remainingBalance)],
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    headStyles: { fillColor: [26, 132, 53], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 15 },
  });

  // Resumo por categoria
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    head: [["RESUMO POR CATEGORIA", "VALOR"]],
    body: Object.entries(expensesByCategory).map(([category, total]) => [
      category,
      formatCurrency(total),
    ]),
    headStyles: { fillColor: [26, 132, 53], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
    styles: { fontSize: 11, cellPadding: 4 },
    margin: { left: 10, right: 10 },
  });

  // Tabela detalhada
  let pageNumber = 1;
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    showHead: "firstPage",
    head: [
      ["TABELA DE REGISTRO DAS DESPESAS", "", "", ""],
      ["Data", "Categoria", "Valor", "Descrição"],
    ],
    body: block.expenses.map((expense) => [
      safe(formatDate(expense.date)),
      safe(EXPENSE_CATEGORY_LABELS[expense.category]),
      safe(formatCurrency(Number(expense.amount))),
      safe(expense.description),
    ]),
    headStyles: { fillColor: [26, 132, 53], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 4, overflow: "linebreak", minCellHeight: 15 },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 30, halign: "right" }, 2: { cellWidth: 30, halign: "right" }, 3: { cellWidth: "auto" } },
    margin: { left: 10, right: 10, bottom: 40 },
    didDrawPage: () => addFooter(pageNumber),
    pageBreak: "auto",
    showFoot: "lastPage",
    foot: [[{ content: "", colSpan: 4 }]],
    footStyles: { minCellHeight: 0, fillColor: [255, 255, 255] },
  });

  // Comprovantes: aqui assumimos que imageUrls já são DataURLs válidos
  for (const expense of block.expenses) {
    if (!expense.imageUrls?.length) continue;
    for (const base64 of expense.imageUrls) {
      try {
        const fmt = dataUrlFormat(base64);
        const clean = stripDataUrl(base64);

        doc.addPage();
        pageNumber++;

        const margin = 20;
        const pageWidth = doc.internal.pageSize.width - 2 * margin;
        const pageHeight = doc.internal.pageSize.height - 2 * margin - 80;

        // No browser não sabemos as dimensões sem criar Image; usamos largura padrão
        // Opcional: medir com <img/> e canvas, mas mantemos simples
        const img = new Image();
        const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.onerror = () => resolve({ w: 800, h: 600 });
          img.src = base64;
        });

        const scale = Math.min(pageWidth / dims.w, (pageHeight * 0.85) / dims.h);
        const imgWidth = dims.w * scale;
        const imgHeight = dims.h * scale;

        const xPos = margin + (pageWidth - imgWidth) / 2;
        const yPos = 50;

        doc.addImage(clean, fmt, xPos, yPos, imgWidth, imgHeight, undefined, "FAST");

        const textY = yPos + imgHeight + 20;
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, textY, pageWidth - 2 * margin, 45, 3, 3, "F");

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        const details = [
          `Despesa: ${expense.name}`,
          `Descrição: ${expense.description}`,
          `Categoria: ${EXPENSE_CATEGORY_LABELS[expense.category]}`,
          `Valor: ${formatCurrency(Number(expense.amount.toString()))}`,
        ];
        details.forEach((line: string, i: number) => {
          doc.text(line, margin + 10, textY + 12 + i * 8);
        });

        addFooter(pageNumber);
      } catch (err) {
        console.error("Erro ao adicionar imagem no PDF (browser):", err);
      }
    }
  }

  // Garante rodapé na primeira página
  doc.setPage(1);
  addFooter(1);

  return doc;
}
