import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type AccountingBlock } from "@/app/types";
import { formatDate, formatCurrency } from "@/app/_lib/utils";
import {
  EXPENSE_CATEGORY_LABELS,
  BLOCK_STATUS_LABELS,
} from "@/app/_constants/transactions";

export async function generateAccountingPDF(block: AccountingBlock) {
  // Create new PDF document
  const doc = new jsPDF();

  // Add header
  doc.setFontSize(20);
  doc.text(`Prestação de Contas - ${block.code}`, 14, 20);

  // Add block info
  doc.setFontSize(12);
  doc.text(`Status: ${BLOCK_STATUS_LABELS[block.status]}`, 14, 35);
  doc.text(`Data de Criação: ${formatDate(block.createdAt)}`, 14, 42);
  doc.text(
    `Valor Disponibilizado: ${formatCurrency(Number(block.request?.amount))}`,
    14,
    49,
  );

  // Calculate totals
  const totalExpenses = block.expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );
  const remainingBalance = Number(block.initialAmount) - totalExpenses;

  doc.text(`Saldo: ${formatCurrency(remainingBalance)}`, 14, 56);

  // Add expenses table
  const tableData = block.expenses.map((expense) => [
    formatDate(expense.date),
    expense.name,
    expense.description,
    EXPENSE_CATEGORY_LABELS[expense.category],
    formatCurrency(Number(expense.amount)),
  ]);

  autoTable(doc, {
    head: [["Data", "Nome", "Descrição", "Categoria", "Valor"]],
    body: tableData,
    startY: 65,
  });

  // Add receipts
  let yPos = doc.lastAutoTable.finalY + 20;

  doc.text("Comprovantes:", 14, yPos);
  yPos += 10;

  // Add receipt images
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const url of expense.imageUrls) {
        try {
          // Load image
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
