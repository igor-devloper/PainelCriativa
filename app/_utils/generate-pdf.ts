/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AccountingBlock } from "@/app/types";
import { formatDate, formatCurrency } from "@/app/_lib/utils";

// Company CNPJs mapping
const COMPANY_CNPJS = {
  "GSM SOLARION 02": "44.910.546/0001-55",
  "CRIATIVA ENERGIA": "Não consta",
  "OESTE BIOGÁS": "41.106.939/0001-12",
  "EXATA I": "38.406.585/0001-17",
};

async function addReceiptToPage(doc: jsPDF, expense: any, url: string) {
  try {
    const img = await loadImage(url);

    // Add new page for each receipt
    doc.addPage();

    // Set up dimensions
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;

    // Add receipt title
    doc.setFontSize(12);
    doc.text("COMPROVANTE", margin, margin);

    // Calculate image dimensions
    const maxWidth = pageWidth - 2 * margin;
    const maxHeight = 200; // Fixed maximum height for receipts

    // Calculate scaled dimensions maintaining aspect ratio
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const imgWidth = img.width * scale;
    const imgHeight = img.height * scale;

    // Center image horizontally
    const xPos = (pageWidth - imgWidth) / 2;

    // Add image with calculated dimensions
    doc.addImage(img, "JPEG", xPos, margin + 10, imgWidth, imgHeight);

    // Add expense details below image
    const textY = margin + imgHeight + 20;
    doc.setFontSize(10);
    doc.text(
      [
        `Data: ${formatDate(expense.date)}`,
        `Despesa: ${expense.name}`,
        `Descrição: ${expense.description}`,
        `Valor: ${formatCurrency(Number(expense.amount))}`,
      ],
      margin,
      textY,
    );
  } catch (error) {
    console.error("Error loading receipt image:", error);
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);
    doc.text("Erro ao carregar imagem do comprovante", 20, 20 + 10);
    doc.setTextColor(0, 0, 0);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for CORS
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));

    // Add timestamp to URL to prevent caching issues
    const timestampedUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
    img.src = timestampedUrl;
  });
}

export async function generateAccountingPDF(
  block: AccountingBlock,
  companyName: string,
  name: string,
) {
  const doc = new jsPDF();

  // Logo settings
  const logoWidth = 30;
  const logoHeight = logoWidth * (551 / 453);
  doc.addImage("/logo.png", "PNG", 140, 10, logoWidth, logoHeight);

  const getCompanyCNPJ = (companyName: string): string => {
    return companyName in COMPANY_CNPJS
      ? COMPANY_CNPJS[companyName as keyof typeof COMPANY_CNPJS]
      : "";
  };

  const companyCNPJ = getCompanyCNPJ(companyName);

  // Header table
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

  // Colaborador data
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

  // Financial summary
  const totalExpenses = block.expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );
  const remainingBalance = Number(block.initialAmount) - totalExpenses;

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    body: [
      ["Valor disponibilizado:", formatCurrency(Number(block.request?.amount))],
      ["Saldo:", formatCurrency(remainingBalance)],
      ["Total das despesas:", formatCurrency(totalExpenses)],
    ],
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
  });

  // Expenses table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Data", "Fonte", "Crédito", "Valor despesa", "Descrição Despesa"]],
    body: block.expenses.map((expense) => [
      formatDate(expense.date),
      expense.name,
      formatCurrency(Number(expense.amount)),
      formatCurrency(Number(expense.amount)),
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

  // Handle receipts
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const url of expense.imageUrls) {
        await addReceiptToPage(doc, expense, url);
      }
    }
  }

  return doc;
}
