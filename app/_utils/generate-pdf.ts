import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatCurrency } from "@/app/_lib/utils";

interface Expense {
  date: string;
  name: string;
  amount: number;
  description: string;
  imageUrls?: string[];
}

interface AccountingBlock {
  code: string;
  createdAt: string;
  initialAmount: number;
  expenses: Expense[];
  request?: {
    amount: number;
  };
}

const COMPANY_CNPJS: Record<string, string> = {
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
    (total, expense) => total + Number(expense.amount),
    0,
  );
  const remainingBalance = Number(block.initialAmount) - totalExpenses;

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    body: [
      ["Valor disponibilizado:", formatCurrency(Number(block.request?.amount))],
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

  // Pré-carregamento de imagens
  const preloadedImages = await preloadImages(
    block.expenses.flatMap((expense) => expense.imageUrls || []),
  );

  // Adicionar recibos
  for (const expense of block.expenses) {
    if (expense.imageUrls && expense.imageUrls.length > 0) {
      for (const url of expense.imageUrls) {
        const img = preloadedImages[url];
        if (img) {
          doc.addPage();
          const margin = 20;
          const imgWidth = 100;
          const imgHeight = (imgWidth * img.height) / img.width;
          doc.addImage(img, "JPEG", margin, margin, imgWidth, imgHeight);

          const textY = margin + imgHeight + 10;
          doc.setFontSize(10);
          doc.text(
            `Despesa: ${expense.name}\nDescrição: ${expense.description}\nValor: ${formatCurrency(
              Number(expense.amount),
            )}`,
            margin,
            textY,
          );
        }
      }
    }
  }

  return doc;
}

async function preloadImages(
  urls: string[],
): Promise<Record<string, HTMLImageElement>> {
  const imageMap: Record<string, HTMLImageElement> = {};
  const promises = urls.map(
    (url) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageMap[url] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      }),
  );
  await Promise.all(promises);
  return imageMap;
}
