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
      ["Total de adiantamento:", formatCurrency(Number(block.request?.amount))],
      ["Saldo:", formatCurrency(remainingBalance)],
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
      overflow: "linebreak", // Enable line breaking for long text
    },
    columnStyles: {
      4: { cellWidth: 80 }, // Set wider column for description
    },
  });

  // Add receipts, one per page
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const url of expense.imageUrls) {
        try {
          const img = await loadImage(url);

          // Start a new page for each receipt
          doc.addPage();

          // Add receipt image
          const margin = 20;
          const imgWidth = 160; // Adjusted image width
          const imgHeight = (imgWidth * img.height) / img.width; // Maintain aspect ratio
          doc.addImage(img, "JPEG", margin, margin, imgWidth, imgHeight);

          // Add expense info below the image
          const textY = margin + imgHeight + 10;
          doc.setFontSize(10);
          doc.text(
            `Despesa: ${expense.name}\nDescrição: ${expense.description}\nValor: ${formatCurrency(
              Number(expense.amount),
            )}`,
            margin,
            textY,
          );
        } catch (error) {
          console.error("Error loading receipt image:", error);
        }
      }
    }
  }

  return doc;
}

// Helper function to load images
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
