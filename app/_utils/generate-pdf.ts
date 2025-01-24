import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AccountingBlock } from "@/app/types";
import { formatDate, formatCurrency } from "@/app/_lib/utils";
import { clerkClient } from "@clerk/nextjs/server";

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
) {
  // Create new PDF document
  const doc = new jsPDF();

  // Resize and add the logo
  const logoWidth = 30; // Width of the logo
  const logoHeight = logoWidth * (551 / 453); // Maintain original aspect ratio
  doc.addImage("/logo.png", "PNG", 140, 10, logoWidth, logoHeight);

  const getCompanyCNPJ = (companyName: string): string => {
    return companyName in COMPANY_CNPJS
      ? COMPANY_CNPJS[companyName as keyof typeof COMPANY_CNPJS]
      : "";
  };

  // Fetch user information
  const user = await clerkClient.users.getUser(block.request?.userId ?? "");
  const userName = user?.firstName ?? "N/A";

  const companyCNPJ = getCompanyCNPJ(companyName);

  // Add header table with updated styling
  autoTable(doc, {
    startY: 10 + logoHeight + 5, // Adjust position after logo
    head: [],
    body: [
      [
        {
          content: "Data da última atualização:",
          styles: { fontStyle: "bold", cellWidth: 50 },
        },
        {
          content: formatDate(new Date()),
          styles: { cellWidth: 40 },
        },
      ],
      [
        {
          content: "Empresa:",
          styles: { fontStyle: "bold" },
        },
        {
          content: companyName,
        },
      ],
      [
        {
          content: "CNPJ:",
          styles: { fontStyle: "bold" },
        },
        {
          content: companyCNPJ,
        },
      ],
      [
        {
          content: "Documento:",
          styles: { fontStyle: "bold" },
        },
        {
          content: `Prestação de Contas - ${block.code}`,
        },
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
    margin: { right: 70 },
  });

  // Add "DADOS COLABORADOR" section with gray background
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
      ["Colaborador:", userName],
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

  // Add financial information table
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

  // Add expenses table with new styling
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
    },
  });

  // Add receipts section
  let yPos = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(12);
  doc.text("Comprovantes:", 14, yPos);
  yPos += 10;

  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const url of expense.imageUrls) {
        try {
          const img = await loadImage(url);

          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.addImage(img, "JPEG", 14, yPos, 100, 100);
          yPos += 110;

          doc.setFontSize(9);
          doc.text(
            `${expense.name} - ${expense.description} - ${formatCurrency(Number(expense.amount))}`,
            14,
            yPos,
          );
          yPos += 20;
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
