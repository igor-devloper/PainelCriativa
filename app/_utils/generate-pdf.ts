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
  name: string,
) {
  const doc = new jsPDF();

  // Função para adicionar rodapé
  const addFooter = (pageNumber: number) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Adiciona linha separadora
    doc.setDrawColor(26, 132, 53);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 25, pageWidth - 10, pageHeight - 25);

    // Adiciona logo pequena mantendo proporção
    const logoHeight = 25;
    const logoWidth = logoHeight * (453 / 551); // Correct aspect ratio based on original dimensions
    doc.addImage(
      "/logo.png",
      "PNG",
      10,
      pageHeight - 24, // Changed from 7 to pageHeight - 20
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
  // Função para adicionar cabeçalho (apenas na primeira página)
  const addHeader = () => {
    // Adiciona logo mantendo proporção original
    const logoHeight = 30;
    const logoWidth = logoHeight * (453 / 551); // Proporção correta baseada nas dimensões originais

    doc.setFontSize(20);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(10, 10, doc.internal.pageSize.width - 20, 30, 3, 3, "F");
    doc.addImage(
      "/logo.png",
      "PNG",
      10,
      10,
      logoWidth,
      logoHeight,
      undefined,
      "FAST",
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      "Relatório de Prestação de Contas",
      doc.internal.pageSize.width / 2,
      28,
      {
        align: "center",
      },
    );
  };

  // Adiciona cabeçalho apenas na primeira página
  addHeader();

  const companyCNPJ = COMPANY_CNPJS[companyName] || "";
  // Adiciona informações do documento
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
    headStyles: {
      fillColor: [26, 132, 53],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    margin: { left: 15 },
  });

  // Adiciona informações bancárias
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

  // Adiciona resumo financeiro
  const totalExpenses = block.expenses.reduce(
    (total, expense) => total + Number(expense.amount.toString()),
    0,
  );
  const remainingBalance =
    Number(block.initialAmount?.toString()) - totalExpenses;

  const expensesByCategory = calculateExpensesByCategory(block.expenses);

  const statusY = doc.lastAutoTable.finalY + 20;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, statusY, 190, 70, 3, 3, "F");

  autoTable(doc, {
    startY: statusY + 5,
    head: [["RESUMO DE FECHAMENTO", "", "", "", ""]],
    body: [
      ["Status da Prestação de Contas:", BLOCK_STATUS_LABELS[block.status]],
      [
        "Status da Solicitação:",
        REQUEST_STATUS_LABELS[block.request?.status || RequestStatus.WAITING],
      ],
      [
        "Valor disponibilizado:",
        formatCurrency(Number(block.request?.amount?.toString())),
      ],
      ["Total das despesas:", formatCurrency(totalExpenses)],
      ["Saldo restante:", formatCurrency(remainingBalance)],
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    headStyles: {
      fillColor: [26, 132, 53],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold" },
    },
    margin: { left: 15 },
  });
  // Adiciona resumo por categoria

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
    columnStyles: {
      1: { halign: "right" },
    },
    styles: { fontSize: 11, cellPadding: 4 },
    margin: { left: 10, right: 10 },
  });
  const margin = 10;
  // Adiciona tabela detalhada de despesas
  let pageNumber = 1;
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    showHead: "firstPage",
    head: [
      ["TABELA DE REGISTRO DAS DESPESAS", "", "", ""],
      ["Data", "Categoria", "Valor", "Descrição"],
    ],
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
      minCellHeight: 15,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin, bottom: 40 },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    didDrawPage: (data) => {
      addFooter(pageNumber);
    },
    pageBreak: "auto",
    showFoot: "lastPage",
    foot: [[{ content: "", colSpan: 4 }]],
    footStyles: {
      minCellHeight: 0,
      fillColor: [255, 255, 255],
    }, // Reserve space for footer
  });

  // Adiciona imagens das despesas

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
            (pageHeight * 0.85) / dimensions.height, // Changed from 0.7 to 0.85
          ); // Reduced to 70% of page height

          const imgWidth = dimensions.width * scale;
          const imgHeight = dimensions.height * scale;

          // Centraliza imagem horizontalmente
          const xPos = margin + (pageWidth - imgWidth) / 2;
          const yPos = 40;

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
          const textY = yPos + imgHeight + 20;
          doc.setFillColor(248, 249, 250);
          doc.roundedRect(margin, textY, pageWidth - 2 * margin, 45, 3, 3, "F"); // Modify text box height from 55 to 45

          // Adiciona detalhes da despesa com melhor formatação
          doc.setFontSize(9); // Reduce font size from 10 to 9
          doc.setTextColor(0, 0, 0);
          const expenseDetails = [
            `Despesa: ${expense.name}`,
            `Descrição: ${expense.description}`,
            `Categoria: ${EXPENSE_CATEGORY_LABELS[expense.category]}`,
            `Valor: ${formatCurrency(Number(expense.amount.toString()))}`,
          ];

          expenseDetails.forEach((line, index) => {
            doc.text(line, margin + 10, textY + 12 + index * 8); // Adjust spacing between lines from 10 to 8
          });

          expenseDetails.forEach((line, index) => {
            doc.text(line, margin + 10, textY + 12 + index * 8); // Adjust spacing between lines from 10 to 8
          });

          addFooter(pageNumber);
        } catch (error) {
          console.error("Erro ao processar imagem para o PDF:", error);
        }
      }
    }
  }

  doc.setPage(2);
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
