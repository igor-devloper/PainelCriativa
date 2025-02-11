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

// Tipos
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

// Constantes
const COMPANY_CNPJS: Record<string, string> = {
  "GSM SOLARION 02": "44.910.546/0001-55",
  "CRIATIVA ENERGIA": "Não consta",
  "OESTE BIOGÁS": "41.106.939/0001-12",
  "EXATA I": "38.406.585/0001-17",
};

// Funções auxiliares para processamento de imagens
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

      const maxWidth = 800;
      const maxHeight = 800;
      let { width, height } = img;

      // Calcula proporção
      const aspectRatio = width / height;

      // Ajusta dimensões mantendo proporção
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

    img.onerror = () => {
      reject(new Error("Erro ao carregar imagem"));
    };
  });
}

// Função para calcular despesas por categoria
function calculateExpensesByCategory(
  expenses: Expense[],
): Record<string, number> {
  return expenses.reduce(
    (acc, expense) => {
      const categoryLabel = EXPENSE_CATEGORY_LABELS[expense.category];
      acc[categoryLabel] =
        (acc[categoryLabel] || 0) + Number(expense.amount.toString());
      return acc;
    },
    {} as Record<string, number>,
  );
}

// Função principal para gerar o PDF
export async function generateAccountingPDF(
  block: AccountingBlock,
  companyName: string,
) {
  const doc = new jsPDF();

  // Função para adicionar cabeçalho (apenas na primeira página)

  // Função para adicionar cabeçalho (apenas na primeira página)
  const addHeader = () => {
    // Adiciona cabeçalho verde claro
    doc.setFillColor(144, 238, 144); // Verde mais claro
    doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");

    // Adiciona logo mantendo proporção original (proporção aproximada 1.6:1)
    const logoHeight = 25;
    const logoWidth = logoHeight * (453 / 551); // Correct aspect ratio based on original dimensions
    doc.addImage(
      "/logo.png",
      "PNG",
      10,
      7,
      logoWidth,
      logoHeight,
      undefined,
      "FAST",
    );

    // Adiciona título centralizado em branco
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Prestação de Contas", doc.internal.pageSize.width / 2, 25, {
      align: "center",
    });

    // Reseta cor do texto
    doc.setTextColor(0, 0, 0);
  };

  // Adiciona cabeçalho apenas na primeira página
  addHeader();

  // Função para adicionar rodapé
  const addFooter = (pageNumber: number) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Adiciona linha separadora
    doc.setDrawColor(26, 132, 53);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 25, pageWidth - 10, pageHeight - 25);

    // Adiciona logo pequena mantendo proporção
    const logoHeight = 10;
    const logoWidth = logoHeight * 1.6; // Mantendo a mesma proporção 1.6:1
    doc.addImage(
      "/logo.png",
      "PNG",
      10,
      pageHeight - 20,
      logoWidth,
      logoHeight,
      undefined,
      "FAST",
    );

    // Adiciona texto de copyright
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const currentYear = new Date().getFullYear();
    const copyrightText = `© ${currentYear} Criativa Energia. Todos os direitos reservados. Este documento é confidencial e contém informações proprietárias.`;
    doc.text(copyrightText, pageWidth / 2, pageHeight - 15, {
      align: "center",
    });

    // Adiciona número da página
    doc.setFontSize(10);
    doc.text(`Página ${pageNumber}`, pageWidth - 20, pageHeight - 10);
  };

  // Adiciona cabeçalho apenas na primeira página

  const companyCNPJ = COMPANY_CNPJS[companyName] || "";

  // Adiciona informações do documento
  doc.setFillColor(248, 249, 250); // Cor de fundo mais suave
  doc.roundedRect(10, 50, 190, 40, 3, 3, "F");

  autoTable(doc, {
    startY: 55,
    body: [
      ["Empresa:", companyName],
      ["CNPJ:", companyCNPJ],
      ["Código do Bloco:", block.code],
      ["Data:", formatDate(new Date())],
    ],
    theme: "plain",
    styles: {
      fontSize: 11,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: "bold" },
    },
    margin: { left: 15 },
  });

  // Adiciona informações bancárias
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, 100, 190, 70, 3, 3, "F");

  autoTable(doc, {
    startY: 105,
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

  // Adiciona informações de status
  const statusY = doc.lastAutoTable.finalY + 20;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, statusY, 190, 30, 3, 3, "F");

  autoTable(doc, {
    startY: statusY + 5,
    body: [
      ["Status da Prestação de Contas:", BLOCK_STATUS_LABELS[block.status]],
      [
        "Status da Solicitação:",
        REQUEST_STATUS_LABELS[block.request?.status || RequestStatus.WAITING],
      ],
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold" },
    },
    margin: { left: 15 },
  });

  // Adiciona resumo financeiro
  const totalExpenses = block.expenses.reduce(
    (total, expense) => total + Number(expense.amount.toString()),
    0,
  );
  const remainingBalance =
    Number(block.initialAmount?.toString()) - totalExpenses;

  const summaryY = doc.lastAutoTable.finalY + 20;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, summaryY, 190, 40, 3, 3, "F");

  autoTable(doc, {
    startY: summaryY + 5,
    body: [
      [
        "Valor disponibilizado:",
        formatCurrency(Number(block.request?.amount?.toString())),
      ],
      ["Total das despesas:", formatCurrency(totalExpenses)],
      ["Saldo restante:", formatCurrency(remainingBalance)],
    ],
    theme: "plain",
    styles: {
      fontSize: 12,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  // Adiciona resumo por categoria
  const expensesByCategory = calculateExpensesByCategory(block.expenses);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
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
    columnStyles: {
      1: { halign: "right" },
    },
    styles: { fontSize: 11, cellPadding: 4 },
    margin: { left: 10, right: 10 },
  });

  // Adiciona tabela detalhada de despesas
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [["Data", "Categoria", "Valor", "Descrição"]],
    body: block.expenses.map((expense) => [
      formatDate(expense.date),
      EXPENSE_CATEGORY_LABELS[expense.category],
      formatCurrency(Number(expense.amount.toString())),
      expense.description,
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
    },
    columnStyles: {
      0: { cellWidth: 30 },
      2: { halign: "right" },
      3: { cellWidth: "auto" },
    },
    margin: { left: 10, right: 10 },
  });

  // Adiciona imagens das despesas
  let pageNumber = 1;
  addFooter(pageNumber);

  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const base64Data of expense.imageUrls) {
        try {
          const { base64: normalizedBase64, dimensions } =
            await normalizeBase64Image(base64Data);
          const cleanBase64 = cleanBase64String(normalizedBase64);
          const imageFormat = getBase64ImageFormat(normalizedBase64);

          doc.addPage();
          pageNumber++;

          const margin = 20;
          const pageWidth = doc.internal.pageSize.width - 2 * margin;
          const pageHeight = doc.internal.pageSize.height - 2 * margin - 80; // Increased margin for footer

          // Calcula dimensões para ajustar à página mantendo proporção
          const scale = Math.min(
            pageWidth / dimensions.width,
            (pageHeight * 0.7) / dimensions.height,
          ); // Reduced to 70% of page height

          const imgWidth = dimensions.width * scale;
          const imgHeight = dimensions.height * scale;

          // Centraliza imagem horizontalmente
          const xPos = margin + (pageWidth - imgWidth) / 2;

          // Adiciona imagem
          doc.addImage(
            cleanBase64,
            imageFormat,
            xPos,
            50, // Adjusted starting position
            imgWidth,
            imgHeight,
            undefined,
            "FAST",
          );

          // Adiciona box para detalhes da despesa
          const textY = 60 + imgHeight + 10;
          doc.setFillColor(248, 249, 250);
          doc.roundedRect(margin, textY, pageWidth, 40, 3, 3, "F");

          // Adiciona detalhes da despesa com melhor formatação
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          const expenseDetails = [
            `Despesa: ${expense.name}`,
            `Descrição: ${expense.description}`,
            `Valor: ${formatCurrency(Number(expense.amount.toString()))}`,
          ];

          expenseDetails.forEach((line, index) => {
            doc.text(line, margin + 10, textY + 15 + index * 10);
          });

          addFooter(pageNumber);
        } catch (error) {
          console.error("Erro ao processar imagem para o PDF:", error);
        }
      }
    }
  }

  doc.setPage(1);
  addFooter(1);

  return doc;
}

// Exporta as funções auxiliares para uso em outros módulos
export {
  getBase64ImageFormat,
  cleanBase64String,
  normalizeBase64Image,
  calculateExpensesByCategory,
};
