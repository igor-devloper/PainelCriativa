import "server-only";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "../_lib/utils";
import {
  EXPENSE_CATEGORY_LABELS,
  BLOCK_STATUS_LABELS,
} from "@/app/_constants/transactions";
import { AccountingBlock, ExpenseItem } from "../types";
import Logo from '@/public/logo.png'

/* ========= helpers ========= */

// Evite importar helpers de componentes client.
// Implemento aqui o safeNumber para uso no server.
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

// Lê arquivo do /public como DataURL (Node/Server)
function resolvePublicUrl(pathname: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL // defina no Vercel (e local, se quiser)
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"); // fallback

  // garante / no começo
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalized, base).toString();
}

async function fetchPublicImageAsDataURL(relPath: string) {
  const url = resolvePublicUrl(relPath); // ex: /logo.png -> https://seu-dominio.com/logo.png
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Erro ao carregar imagem pública: ${url} (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const lower = relPath.toLowerCase();
  const ext = lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? "jpeg" : "png";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

// Normaliza imagens (base64) com Sharp p/ garantir PNG válido
async function normalizeBase64ImageServer(base64Data: string): Promise<{
  base64: string;
  dimensions: { width: number; height: number };
}> {
  const sharp = (await import("sharp")).default;
  const raw = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buf = Buffer.from(raw, "base64");
  const img = sharp(buf).png();
  const meta = await img.metadata();
  const out = await img.toBuffer();
  return {
    base64: `data:image/png;base64,${out.toString("base64")}`,
    dimensions: { width: meta.width ?? 800, height: meta.height ?? 600 },
  };
}

function getBase64ImageFormat(dataUrl: string): "PNG" | "JPEG" {
  const m = dataUrl.match(/^data:image\/(\w+);base64,/i);
  return m && /jpe?g/i.test(m[1]) ? "JPEG" : "PNG";
}

const stripDataUrl = (s: string) => s.replace(/^data:image\/\w+;base64,/, "");

function calculateExpensesByCategory(expenses: ExpenseItem[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const categoryLabel = EXPENSE_CATEGORY_LABELS[expense.category];
    acc[categoryLabel] = (acc[categoryLabel] || 0) + Number(expense.amount.toString());
    return acc;
  }, {} as Record<string, number>);
}

function separateExpensesByType(expenses: ExpenseItem[]) {
  const despesas = expenses.filter((e) => e.type === "DESPESA");
  const caixa = expenses.filter((e) => e.type === "CAIXA");
  return { despesas, caixa };
}

function calculateTotals(expenses: ExpenseItem[]) {
  const { despesas, caixa } = separateExpensesByType(expenses);
  const totalDespesas = despesas.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCaixa = caixa.reduce((sum, e) => sum + Number(e.amount), 0);
  return { totalDespesas, totalCaixa };
}

function safe(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

/* ========= principal ========= */

export async function generateAccountingPDF(
  block: AccountingBlock,
  companyName: string,
  name: string
) {
  const doc = new jsPDF();

  // Logo uma única vez
  const logoDataURL = await fetchPublicImageAsDataURL("logo.png");

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
  const reembolso = block.expenses.filter((e) => e.type === "REEMBOLSO");
  const totalExpenses = block.expenses.reduce((total, expense) => total + Number(expense.amount.toString()), 0);
  const totalReembolso = reembolso.reduce((sum, e) => sum + safeNumber(e.amount), 0);
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

  // Comprovantes (imagens)
  for (const expense of block.expenses) {
    if (!expense.imageUrls?.length) continue;
    for (const base64Data of expense.imageUrls) {
      try {
        const { base64: normalizedBase64, dimensions } =
          await normalizeBase64ImageServer(base64Data);

        const cleanBase64 = stripDataUrl(normalizedBase64);
        const imageFormat = getBase64ImageFormat(normalizedBase64);

        doc.addPage();
        pageNumber++;

        const margin = 20;
        const pageWidth = doc.internal.pageSize.width - 2 * margin;
        const pageHeight = doc.internal.pageSize.height - 2 * margin - 80;

        const scale = Math.min(
          pageWidth / dimensions.width,
          (pageHeight * 0.85) / dimensions.height
        );
        const imgWidth = dimensions.width * scale;
        const imgHeight = dimensions.height * scale;

        const xPos = margin + (pageWidth - imgWidth) / 2;
        const yPos = 50;

        doc.addImage(cleanBase64, imageFormat, xPos, yPos, imgWidth, imgHeight, undefined, "FAST");

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
        details.forEach((line, i) => {
          doc.text(line, margin + 10, textY + 12 + i * 8);
        });

        addFooter(pageNumber);
      } catch (err) {
        console.error("Erro ao processar imagem p/ PDF:", err);
      }
    }
  }

  // Garante rodapé na primeira página
  doc.setPage(1);
  addFooter(1);

  return doc;
}
