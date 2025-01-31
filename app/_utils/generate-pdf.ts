import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatCurrency } from "@/app/_lib/utils";
import type { Decimal } from "@prisma/client/runtime/library";

interface Expense {
  date: string;
  name: string;
  amount: number | Decimal;
  description: string;
  imageUrls?: string[];
}

interface AccountingBlock {
  code: string;
  createdAt: string | Date;
  initialAmount?: number | Decimal;
  expenses: Expense[];
  request?: {
    amount: number | Decimal;
  };
}

const COMPANY_CNPJS: Record<string, string> = {
  "GSM SOLARION 02": "44.910.546/0001-55",
  "CRIATIVA ENERGIA": "Não consta",
  "OESTE BIOGÁS": "41.106.939/0001-12",
  "EXATA I": "38.406.585/0001-17",
};

function getBase64ImageFormat(base64String: string): string {
  // Extract image format from base64 string
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? match[1].toUpperCase() : "JPEG"; // Default to JPEG if format not found
}

function cleanBase64String(base64String: string): string {
  // Remove data URL prefix if present
  return base64String.replace(/^data:image\/\w+;base64,/, "");
}

export async function generateAccountingPDF(
  block: AccountingBlock,
  companyName: string,
  name: string,
) {
  const doc = new jsPDF();

  // Adicionar imagem
  const logoWidth = 30;
  const logoHeight = logoWidth * (551 / 453);
  doc.addImage("/logo.png", "PNG", 140, 10, logoWidth, logoHeight);

  const companyCNPJ = COMPANY_CNPJS[companyName] || "";

  // Cabeçalho
  autoTable(doc, {
    startY: 10 + logoHeight + 5,
    body: [
      ["Data da última atualização:", formatDate(new Date())],
      ["Empresa:", companyName],
      ["CNPJ:", companyCNPJ],
      ["Documento:", `Prestação de Contas - ${block.code}`],
    ],
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
    margin: { right: 70 },
  });

  // Colaborador
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [
      [
        {
          content: "DADOS COLABORADOR",
          styles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            halign: "left",
          },
        },
      ],
    ],
    body: [
      ["Colaborador:", name],
      ["Descrição conta financeira:", `Despesas empresa ${companyName}`],
      [
        "Período:",
        `${formatDate(block.createdAt)} à ${formatDate(new Date())}`,
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
  });

  // Resumo financeiro
  const totalExpenses = block.expenses.reduce(
    (total, expense) => total + Number(expense.amount.toString()),
    0,
  );
  const remainingBalance =
    Number(block.initialAmount?.toString()) - totalExpenses;

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    body: [
      [
        "Valor disponibilizado:",
        formatCurrency(Number(block.request?.amount?.toString())),
      ],
      ["Saldo:", formatCurrency(remainingBalance)],
      ["Total das despesas", formatCurrency(totalExpenses)],
    ],
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
  });

  // Despesas
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Data", "Fonte", "Crédito", "Valor despesa", "Descrição Despesa"]],
    body: block.expenses.map((expense) => [
      formatDate(expense.date),
      expense.name,
      formatCurrency(Number(expense.amount.toString())),
      formatCurrency(Number(expense.amount.toString())),
      expense.description,
    ]),
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
      overflow: "linebreak",
    },
    columnStyles: {
      4: { cellWidth: 80 },
    },
  });

  // Handle base64 images
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const base64Data of expense.imageUrls) {
        try {
          doc.addPage();
          const margin = 20;
          const imgWidth = 100;

          // Clean base64 string and get format
          const cleanBase64 = cleanBase64String(base64Data);
          const imageFormat = getBase64ImageFormat(base64Data);

          // Create a temporary canvas to get image dimensions
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0);
              resolve();
            };
            img.onerror = reject;
            // Important: Set crossOrigin to avoid CORS issues
            img.crossOrigin = "anonymous";
            img.src = base64Data;
          });

          const imgHeight = (imgWidth * img.height) / img.width;

          // Add image to PDF using the cleaned base64 string
          doc.addImage(
            cleanBase64,
            imageFormat,
            margin,
            margin,
            imgWidth,
            imgHeight,
            undefined,
            "FAST",
          );

          // Add expense details below image
          const textY = margin + imgHeight + 10;
          doc.setFontSize(10);
          doc.text(
            `Despesa: ${expense.name}\nDescrição: ${expense.description}\nValor: ${formatCurrency(
              Number(expense.amount.toString()),
            )}`,
            margin,
            textY,
          );
        } catch (error) {
          console.error("Error adding image to PDF:", error);
          continue;
        }
      }
    }
  }

  return doc;
}
