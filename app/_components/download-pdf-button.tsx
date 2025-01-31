"use client";

import { Button } from "@/app/_components/ui/button";
import { Download } from "lucide-react";
import { generateAccountingPDF } from "@/app/_utils/generate-pdf";

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
  initialAmount: number;
  expenses: Expense[];
  request?: {
    amount: number;
  };
}

interface DownloadPDFButtonProps {
  block: AccountingBlock;
  userName: string;
}

export function DownloadPDFButton({ block, userName }: DownloadPDFButtonProps) {
  const handleDownload = async () => {
    try {
      const companyName = block.company;
      const doc = await generateAccountingPDF(block, companyName, userName);
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
