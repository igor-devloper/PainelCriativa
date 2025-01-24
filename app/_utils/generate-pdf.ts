import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AccountingBlock } from "@/app/types";
import { formatDate, formatCurrency } from "@/app/_lib/utils";

// Company CNPJs mapping
const COMPANY_CNPJS = {
  "GSM SOLARION 02": "44.910.546/0001-55", // Replace with actual CNPJ
  "CRIATIVA ENERGIA": "Não consta", // Replace with actual CNPJ
  "OESTE BIOGÁS": "41.106.939/0001-12",
  "EXATA I": "38.406.585/0001-17",
};

export async function generateAccountingPDF(
  block: AccountingBlock,
  companyName: string,
) {
  // Create new PDF document
  const doc = new jsPDF();

  // Add Criativa logo in the top right
  const logoWidth = 50; // Largura desejada
  const logoHeight = logoWidth * (551 / 453); // Altura proporcional
  doc.addImage("/logo.png", "PNG", 140, 10, logoWidth, logoHeight);

  const getCompanyCNPJ = (companyName: string): string => {
    return companyName in COMPANY_CNPJS
      ? COMPANY_CNPJS[companyName as keyof typeof COMPANY_CNPJS]
      : "";
  };

  const companyCNPJ = getCompanyCNPJ(companyName);

  // Add header table with updated styling
  autoTable(doc, {
    startY: 10,
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
      ["Colaborador:", block.request?.name || ""],
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

  // Add expenses table with the new styling
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

  // Add receipt images
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const url of expense.imageUrls) {
        try {
          const img = await loadImage(url);

          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          // Add receipt image
          doc.addImage(img, "JPEG", 14, yPos, 100, 100);
          yPos += 110;

          // Add expense info under image
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

// Helper function to load images (remains the same)
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
