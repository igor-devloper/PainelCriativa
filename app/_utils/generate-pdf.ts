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

  // Add receipts section
  if (block.expenses.some((expense) => expense.imageUrls?.length > 0)) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("COMPROVANTES", 14, 20);
  }

  // Add receipts with improved layout
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const url of expense.imageUrls) {
        try {
          const img = await loadImage(url);

          // Calculate image dimensions while maintaining aspect ratio
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          const margin = 20;
          const maxWidth = pageWidth - 2 * margin;
          const maxHeight = pageHeight - 2 * margin - 40; // Leave space for text

          let imgWidth = maxWidth;
          let imgHeight = (imgWidth * img.height) / img.width;

          // If height exceeds maximum, scale based on height instead
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = (imgHeight * img.width) / img.height;
          }

          // Center the image horizontally
          const xPos = (pageWidth - imgWidth) / 2;

          // Add receipt header
          doc.setFontSize(12);
          doc.text("Comprovante de Despesa", xPos, margin);

          // Add image
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
            xPos,
            textY,
          );

          // Add new page for next receipt
          if (expense.imageUrls.indexOf(url) < expense.imageUrls.length - 1) {
            doc.addPage();
          }
        } catch (error) {
          console.error("Error loading receipt image:", error);
          // Add error message to PDF
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text(
            "Erro ao carregar imagem do comprovante",
            20,
            doc.lastAutoTable.finalY + 10,
          );
          doc.setTextColor(0, 0, 0);
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
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = url;
  });
}
