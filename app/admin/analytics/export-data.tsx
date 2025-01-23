/* eslint-disable @typescript-eslint/no-unused-vars */
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

export function ExportDataCard() {
  const [loading, setLoading] = useState(false);

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const data = await exportToExcel();

      // Create blob and download
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Relatório Excel exportado com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar relatório Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const data = await exportToPDF();

      // Create blob and download
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Relatório PDF exportado com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar relatório PDF");
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
            onClick={handleExportExcel}
            disabled={loading}
          >
            Exportar como Excel
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportPDF}
            disabled={loading}
          >
            Exportar como PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
