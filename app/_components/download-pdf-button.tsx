"use client";

import { Button } from "@/app/_components/ui/button";
import { Download } from "lucide-react";
import { generateAccountingPDF } from "@/app/_utils/generate-pdf";
import type { Decimal } from "@prisma/client/runtime/library";

interface Expense {
  date: string;
  name: string;
  amount: number;
  description: string;
  imageUrls?: string[];
}

interface AccountingBlock {
  code: string;
  createdAt: string | Date;
  company: string;
  initialAmount: number | Decimal;
  expenses: Expense[];
  request?: {
    amount: number | Decimal;
    bankName: string | null;
    accountType: string | null;
    accountNumber: string | null;
    accountHolderName: string | null;
    pixKey: string | null;
  };
}

interface DownloadPDFButtonProps {
  block: AccountingBlock;
  userName: string;
}

export function DownloadPDFButton({ block }: DownloadPDFButtonProps) {
  const handleDownload = async () => {
    try {
      // Do not sanitize the block - pass it directly to maintain all properties
      const companyName = block.company;
      console.log("Downloading PDF with block data:", block); // Debug log
      const doc = await generateAccountingPDF(block, companyName);
      doc.save(`prestacao-de-contas-${block.code}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      className="w-full sm:w-auto"
    >
      <Download className="mr-2 h-4 w-4" />
      Baixar PDF
    </Button>
  );
}
