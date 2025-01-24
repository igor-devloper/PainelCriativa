"use client";

import { Button } from "@/app/_components/ui/button";
import { Download } from "lucide-react";
import { generateAccountingPDF } from "@/app/_utils/generate-pdf";
import type { AccountingBlock } from "@/app/types";

interface DownloadPDFButtonProps {
  block: AccountingBlock;
}

export function DownloadPDFButton({ block }: DownloadPDFButtonProps) {
  const handleDownload = async () => {
    try {
      const companyName = block.company;
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
