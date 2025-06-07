"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/app/_hooks/use-toast";
import type { AccountingBlock } from "@/app/types";
import { generateImprovedAccountingPDF } from "../_utils/generate-improved-pdf";

interface ImprovedPDFGeneratorProps {
  block: AccountingBlock;
  userName: string;
  companyName: string;
}

export function ImprovedPDFGenerator({
  block,
  userName,
  companyName,
}: ImprovedPDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = await generateImprovedAccountingPDF(
        block,
        companyName,
        userName,
      );
      doc.save(`prestacao-contas-${block.code}.pdf`);

      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo foi baixado automaticamente.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleGeneratePDF} disabled={isGenerating} size="sm">
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Gerar PDF
      </Button>

      {/* <Button onClick={handleTestPDF} disabled={isGenerating} variant="outline" size="sm">
        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
        Teste PDF
      </Button> */}
    </div>
  );
}
