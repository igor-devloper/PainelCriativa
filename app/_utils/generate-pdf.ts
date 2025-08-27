// app/_utils/generate-pdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "../_lib/utils";
import {
  EXPENSE_CATEGORY_LABELS,
  BLOCK_STATUS_LABELS,
} from "@/app/_constants/transactions";
import { AccountingBlock, ExpenseItem } from "../types";
import { safeNumber } from "../_components/accounting-block-dialog";

/* =========================
   Helpers específicos
   ========================= */

const COMPANY_CNPJS: Record<string, string> = {
  "GSM SOLARION 02": "44.910.546/0001-55",
  "CRIATIVA ENERGIA": "Não consta",
  "OESTE BIOGÁS": "41.106.939/0001-12",
  "EXATA I": "38.406.585/0001-17",
};

// Carrega arquivo do diretório `public/` como DataURL (server-safe)
async function loadPublicImageAsDataURL(relPath: string) {
  // Evita problemas com caminhos começando com "/"
  const clean = relPath.replace(/^\/+/, "");
  // Carregar somente em ambiente Node (server)
  const [{ readFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const abs = path.join(process.cwd(), "public", clean);
  const buf = await readFile(abs);
  const ext = path.extname(abs).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// Browser-only normalizer (mantida para CSR)
async function normalizeBase64ImageBrowser(base64Data: string): Promise<{
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

      const maxWidth = 800;
      const maxHeight = 800;
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

      const normalizedBase64 = canvas.toDataURL("image/png");
      resolve({
        base64: normalizedBase64,
        dimensions: { width, height },
      });
    };

    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
  });
}

// Server-safe normalizer (Sharp). Se não quiser sharp, você pode apenas retornar a imagem original.
async function normalizeBase64ImageServer(base64Data: string): Promise<{
  base64: string;
  dimensions: { width: number; height: number };
}> {
  const sharp = (await import("sharp")).default;
  const raw = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buf = Buffer.from(raw, "base64");
  // força PNG válido
  const img = sharp(buf).png();
  const meta = await img.metadata();
  const out = await img.toBuffer();
  const dataUrl = `data:image/png;base64,${out.toString("base64")}`;
  return {
    base64: dataUrl,
    dimensions: { width: meta.width ?? 800, height: meta.height ?? 600 },
  };
}

// Normalizador universal (browser ou server)
async function normalizeBase64ImageUniversal(base64Data: string) {
  if (typeof window !== "undefined") {
    return normalizeBase64ImageBrowser(base64Data);
  }
  return normalizeBase64ImageServer(base64Data);
}

function getBase64ImageFormat(base64String: string): "PNG" | "JPEG" {
  const match = base64String.match(/^data:image\/(\w+);base64,/i);
  if (!match) return "PNG";
  return /jpeg|jpg/i.test(match[1]) ? "JPEG" : "PNG";
}

function cleanBase64String(base64String: string): string {
  return base64String.replace(/^data:image\/\w+;base64,/, "");
}

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
  if (value === null || value === undefined) return "";
  return String(value);
}

/* =========================
   Função principal
   ========================= */

export async function generateAccountingPDF(
  block: AccountingBlock,
  companyName: string,
  name: string
) {
  const doc = new jsPDF();

  // Carrega o logo como DataURL (uma vez)
  const logoDataURL = await loadPublicImageAsDataURL("logo.png");

  const { totalDespesas, totalCaixa } = calculateTotals(block.expenses);
  const valorSolicitado = block.request?.amount
    ? Number(block.request.amount)
    : 0;

  // Cabeçalho (1ª página)
  const addHeader = () => {
    const logoHeight = 30;
    const logoWidth = logoHeight * (453 / 551); // mantém proporção

    doc.setFontSize(20);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(10, 10, doc.internal.pageSize.width - 20, 30, 3, 3, "F");
    doc.addImage(
      logoDataURL,
      "PNG",
      10,
      10,
      logoWidth,
      logoHeight,
      undefined,
      "FAST"
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      "Relatório de Prestação de Contas",
      doc.internal.pageSize.width / 2,
      28,
      { align: "center" }
    );
  };

  // Rodapé (todas as páginas)
  const addFooter = (pageNumber: number) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    doc.setDrawColor(26, 132, 53);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 25, pageWidth - 10, pageHeight - 25);

    const logoHeight = 25;
    const logoWidth = logoHeight * (453 / 551);
    doc.addImage(
      logoDataURL,
      "PNG",
      10,
      pageHeight - 24,
      logoWidth,
      logoHeight,
      undefined,
      "FAST"
    );

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const currentYear = new Date().getFullYear();
    const copyrightText = `© ${currentYear} Criativa Energia. Todos os direitos reservados. Este documento é confidencial e contém informações proprietárias.`;
    doc.text(copyrightText, pageWidth / 2, pageHeight - 15, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(`Página ${pageNumber}`, pageWidth - 20, pageHeight - 10);
  };

  // ---- Página 1
  addHeader();

  const companyCNPJ = COMPANY_CNPJS[companyName] || "";

  // Box de dados da prestação
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
    headStyles: {
      fillColor: [26, 132, 53],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
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
    headStyles: {
      fillColor: [26, 132, 53],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    margin: { left: 15, right: 15 },
  });

  // Resumo financeiro
  const reembolso = block.expenses.filter((e) => e.type === "REEMBOLSO");
  const totalExpenses = block.expenses.reduce(
    (total, expense) => total + Number(expense.amount.toString()),
    0
  );
  const totalReembolso = reembolso.reduce((sum, e) => sum + safeNumber(e.amount), 0);
  const remainingBalance =
    (Number(block.initialAmount?.toString()) + totalCaixa + totalReembolso) -
    totalExpenses;

  const expensesByCategory = calculateExpensesByCategory(block.expenses);

  const statusY = (autoTable as any).previous?.finalY
    ? (autoTable as any).previous.finalY + 20
    : doc.lastAutoTable?.finalY
    ? doc.lastAutoTable.finalY + 20
    : 200;

  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, statusY, 190, 70, 3, 3, "F");
  const rembolsoNecessario =
    remainingBalance < 0 ? "Reembolso necessário" : "Reembolso feito";

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
    headStyles: {
      fillColor: [26, 132, 53],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
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
    headStyles: {
      fillColor: [26, 132, 53],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
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
    headStyles: {
      fillColor: [26, 132, 53],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
      overflow: "linebreak",
      minCellHeight: 15,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: "auto" },
    },
    margin: { left: 10, right: 10, bottom: 40 },
    didDrawPage: () => addFooter(pageNumber),
    pageBreak: "auto",
    showFoot: "lastPage",
    foot: [[{ content: "", colSpan: 4 }]],
    footStyles: { minCellHeight: 0, fillColor: [255, 255, 255] },
  });

  // Páginas com imagens de comprovantes
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const base64Data of expense.imageUrls) {
        try {
          const { base64: normalizedBase64, dimensions } =
            await normalizeBase64ImageUniversal(base64Data);

          const cleanBase64 = cleanBase64String(normalizedBase64);
          const imageFormat = getBase64ImageFormat(normalizedBase64); // "PNG" | "JPEG"

          doc.addPage();
          pageNumber++;

          const margin = 20;
          const pageWidth = doc.internal.pageSize.width - 2 * margin;
          const pageHeight =
            doc.internal.pageSize.height - 2 * margin - 80; // espaço p/ rodapé

          // escala mantendo proporção
          const scale = Math.min(
            pageWidth / dimensions.width,
            (pageHeight * 0.85) / dimensions.height
          );
          const imgWidth = dimensions.width * scale;
          const imgHeight = dimensions.height * scale;

          const xPos = margin + (pageWidth - imgWidth) / 2;
          const yPos = 50;

          doc.addImage(
            cleanBase64,
            imageFormat,
            xPos,
            yPos,
            imgWidth,
            imgHeight,
            undefined,
            "FAST"
          );

          // Caixa com detalhes
          const textY = yPos + imgHeight + 20;
          doc.setFillColor(248, 249, 250);
          doc.roundedRect(margin, textY, pageWidth - 2 * margin, 45, 3, 3, "F");

          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          const expenseDetails = [
            `Despesa: ${expense.name}`,
            `Descrição: ${expense.description}`,
            `Categoria: ${EXPENSE_CATEGORY_LABELS[expense.category]}`,
            `Valor: ${formatCurrency(Number(expense.amount.toString()))}`,
          ];
          expenseDetails.forEach((line, index) => {
            doc.text(line, margin + 10, textY + 12 + index * 8);
          });

          addFooter(pageNumber);
        } catch (error) {
          console.error("Erro ao processar imagem para o PDF:", error);
        }
      }
    }
  }

  // Garante rodapé da primeira página (se necessário)
  doc.setPage(1);
  addFooter(1);

  return doc;
}

// Exports auxiliares caso use em testes
export {
  calculateExpensesByCategory,
  separateExpensesByType,
  calculateTotals,
  cleanBase64String,
  getBase64ImageFormat,
  normalizeBase64ImageUniversal,
  loadPublicImageAsDataURL,
};
