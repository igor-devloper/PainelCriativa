"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { AccountingBlock } from "../types/accounting";
import { generateAccountingPDF } from "../_utils/generate-pdf";
import { Button } from "./ui/button";
import { toast } from "@/app/_hooks/use-toast";

interface DownloadPDFButtonProps {
  block: AccountingBlock;
  userName: string;
}

export function DownloadPDFButton({ block, userName }: DownloadPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const companyName = block.company;
      const responsibleName = block.request?.accountHolderName ?? userName;

      const doc = await generateAccountingPDF(
        block,
        companyName,
        responsibleName,
      );

      // Nome limpo para o arquivo
      const cleanCode = block.code.replace(/[^a-zA-Z0-9-_]/g, "-");
      doc.save(`prestacao-de-contas-${cleanCode}.pdf`);

      toast({
        title: "PDF gerado com sucesso",
        description: "O download foi iniciado.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      disabled={isLoading}
    >
      <Download className="mr-2 h-4 w-4" />
      {isLoading ? "Gerando..." : "Baixar PDF"}
    </Button>
  );
}
