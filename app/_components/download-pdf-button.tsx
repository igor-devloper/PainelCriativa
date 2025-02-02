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
    bankName?: string | null;
    accountType?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
    pixKey?: string | null;
  };
}

interface DownloadPDFButtonProps {
  block: AccountingBlock;
  userName: string;
}

export function DownloadPDFButton({ block }: DownloadPDFButtonProps) {
  // Sanitize the request object
  const sanitizedBlock: AccountingBlock = {
    ...block,
    request: block.request
      ? {
          ...block.request,
          amount: block.request.amount,
          bankName: block.request.bankName || "Não informado",
          accountType: block.request.accountType || "Não informado",
          accountNumber: block.request.accountNumber || "Não informado",
          accountHolderName: block.request.accountHolderName || "Não informado",
          pixKey: block.request.pixKey || "Não informado",
        }
      : undefined,
  };

  const handleDownload = async () => {
    try {
      const companyName = sanitizedBlock.company;
      const doc = await generateAccountingPDF(sanitizedBlock, companyName);
      doc.save(`prestacao-de-contas-${sanitizedBlock.code}.pdf`);
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
