/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { closeAccountingBlock } from "@/app/_actions/close-accounting-block";
import { toast } from "../_hooks/use-toast";

interface Props {
  block: { id: string };
}

function FecharBlocoButton({ block }: Props) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleCloseBlock = async () => {
    setLoading(true);
    try {
      const result = await closeAccountingBlock(block.id);

      if (result.status === "closed") {
        toast({
          title: "Prestação de contas encerrada",
          description: result.message,
        });

        // Abre PDF em nova aba e também salva para mostrar link
        if (result.pdfUrl) {
          window.open(result.pdfUrl, "_blank");
          setPdfUrl(result.pdfUrl);
        }
      } else if (result.status === "awaiting_reimbursement") {
        toast({
          title: "Atenção",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro ao fechar bloco",
        description: err.message ?? "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleCloseBlock} disabled={loading}>
        {loading ? "Fechando..." : "Fechar Prestação"}
      </Button>

      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-blue-600 underline hover:text-blue-800"
        >
          Visualizar PDF gerado
        </a>
      )}
    </div>
  );
}

export default FecharBlocoButton;
