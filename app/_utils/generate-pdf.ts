import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Decimal } from "@prisma/client/runtime/library";
import { formatCurrency, formatDate } from "../_lib/utils";

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

      const maxWidth = 800;
      const maxHeight = 800;
      let { width, height } = img;

      // Calculate aspect ratio
      const aspectRatio = width / height;

      // Adjust dimensions while maintaining aspect ratio
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
  });
}

export async function generateAccountingPDF(
  block: AccountingBlock,
  companyName: string,
) {
  const doc = new jsPDF();

  // Add logo
  doc.addImage("/logo.png", "PNG", 140, 10, 30, 30);

  const companyCNPJ = COMPANY_CNPJS[companyName] || "";

  // Add header information
  autoTable(doc, {
    startY: 50,
    body: [
      ["Data da última atualização:", formatDate(new Date())],
      ["Empresa:", companyName],
      ["CNPJ:", companyCNPJ],
      ["Documento:", `Prestação de Contas - ${block.code}`],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    margin: { right: 70 },
  });

  // Add bank information
  const bankInfo = [
    ["Banco:", block.request?.bankName || "Não informado"],
    ["Tipo de Conta:", block.request?.accountType || "Não informado"],
    ["Número da Conta:", block.request?.accountNumber || "Não informado"],
    ["Titular:", block.request?.accountHolderName || "Não informado"],
    ["Chave PIX:", block.request?.pixKey || "Não informado"],
  ];

  console.log(bankInfo);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["DADOS BANCÁRIOS DO COLABORADOR"]],
    body: bankInfo,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
  });

  // Calculate totals
  const totalExpenses = block.expenses.reduce(
    (total, expense) => total + Number(expense.amount.toString()),
    0,
  );
  const remainingBalance =
    Number(block.initialAmount?.toString()) - totalExpenses;

  // Add financial summary
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
    styles: { fontSize: 10, cellPadding: 2 },
  });

  // Add expenses table
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
    styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
    columnStyles: { 4: { cellWidth: 80 } },
  });

  // Add expense images
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const base64Data of expense.imageUrls) {
        try {
          const { base64: normalizedBase64, dimensions } =
            await normalizeBase64Image(base64Data);
          const cleanBase64 = cleanBase64String(normalizedBase64);
          const imageFormat = getBase64ImageFormat(normalizedBase64);

          doc.addPage();
          const margin = 20;
          const pageWidth = doc.internal.pageSize.width - 2 * margin;
          const pageHeight = doc.internal.pageSize.height - 2 * margin - 40; // 40px for text below

          // Calculate dimensions to fit page while maintaining aspect ratio
          const scale = Math.min(
            pageWidth / dimensions.width,
            pageHeight / dimensions.height,
          );

          const imgWidth = dimensions.width * scale;
          const imgHeight = dimensions.height * scale;

          // Center image horizontally
          const xPos = margin + (pageWidth - imgWidth) / 2;

          // Add image
          doc.addImage(
            cleanBase64,
            imageFormat,
            xPos,
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
          console.error("Erro ao processar imagem para o PDF:", error);
        }
      }
    }
  }

  return doc;
}
