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
import { exportToExcel, exportToPDF } from "@/app/_actions/admin-analytics";
import { toast } from "sonner";
import { FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";

export function ExportDataCard() {
  const [loading, setLoading] = useState(false);

  const downloadFile = (
    data: Uint8Array,
    filename: string,
    mimeType: string,
  ) => {
    try {
      const blob = new Blob([data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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
        toast.error("Não há dados suficientes para gerar o relatório");
        return;
      }

      const fileName = `relatorio-${format(new Date(), "yyyy-MM-dd")}.${fileType}`;
      const mimeType =
        fileType === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";

      downloadFile(data, fileName, mimeType);
      toast.success(
        `Relatório ${fileType.toUpperCase()} exportado com sucesso`,
      );
    } catch (error) {
      console.error(`Export error (${fileType}):`, error);
      toast.error(`Erro ao exportar relatório ${fileType.toUpperCase()}`);
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
            onClick={() => handleExport(exportToExcel, "xlsx")}
            disabled={loading}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar como Excel
          </Button>
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
