"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { exportToPDF } from "@/app/_actions/admin-analytics";
import { useToast } from "@/app/_hooks/use-toast";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export function ExportDataCard() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const downloadFile = (
    data: Uint8Array,
    filename: string,
    mimeType: string,
  ) => {
    try {
      // Create blob with explicit type
      const blob = new Blob([data], { type: mimeType });

      // Create object URL
      const url = URL.createObjectURL(blob);

      // Create temporary link
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      link.download = filename;

      // Append, click, and cleanup
      document.body.appendChild(link);
      link.click();

      // Small timeout to ensure the download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Download error:", error);
      throw new Error("Erro ao fazer download do arquivo");
    }
  };

  const handleExport = async (
    exportFunction: () => Promise<Uint8Array | null>,
    fileType: "xlsx" | "pdf",
  ) => {
    setLoading(true);
    try {
      const data = await exportFunction();

      if (!data) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não há dados suficientes para gerar o relatório",
        });
        return;
      }

      const fileName = `relatorio-${format(new Date(), "yyyy-MM-dd")}.${fileType}`;
      const mimeType =
        fileType === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";

      downloadFile(data, fileName, mimeType);
      toast({
        title: "Sucesso",
        description: `Relatório ${fileType.toUpperCase()} exportado com sucesso`,
      });
    } catch (error) {
      console.error(`Export error (${fileType}):`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao exportar relatório ${fileType.toUpperCase()}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Dados</CardTitle>
        <CardDescription>
          Exporte relatórios em diferentes formatos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => handleExport(exportToPDF, "pdf")}
            disabled={loading}
          >
            <FileText className="mr-2 h-4 w-4" />
            Exportar como PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
