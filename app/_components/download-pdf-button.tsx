"use client";

import { Download } from "lucide-react";
import type { AccountingBlock } from "../types/accounting";
import { generateAccountingPDF } from "../_utils/generate-pdf";
import { Button } from "./ui/button";

interface DownloadPDFButtonProps {
  block: AccountingBlock;
  userName: string;
}

export function DownloadPDFButton({ block, userName }: DownloadPDFButtonProps) {
  const handleDownload = async () => {
    try {
      // Do not sanitize the block - pass it directly to the PDF generator
      const companyName = block.company;
      const name = block.request?.accountHolderName;
      console.log(
        `Downloading PDF with block ${block.code} for user ${userName}`,
      );
      const doc = await generateAccountingPDF(block, companyName, name ?? "");
      doc.save(`prestacao-de-contas-${block.code}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <Button onClick={handleDownload} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Baixar PDF
    </Button>
  );
}
