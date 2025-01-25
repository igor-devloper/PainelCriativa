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
import { Calendar } from "@/app/_components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Building, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCompanyMetrics } from "@/app/_actions/admin-analytics";
import type { CompanyMetrics } from "@/app/_actions/admin-analytics";
import { toast } from "@/app/_hooks/use-toast";
import type { DateRange } from "react-day-picker";
import { cn } from "@/app/_lib/utils";

export function CompanyMetricsCard() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [metrics, setMetrics] = useState<CompanyMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  };
  const handleViewReport = async () => {
    try {
      setLoading(true);
      const startDate = date?.from || new Date();
      const endDate = date?.to || startDate;

      const data = await getCompanyMetrics(startDate, endDate);
      setMetrics(data);
      toast({
        title: "Sucesso",
        description: `Relatório por empresas de ${startDate.toLocaleString("pt-BR", options)} até ${endDate.toLocaleString("pt-BR", options)} gerado com sucesso`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao carregar métricas`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas por Empresa</CardTitle>
        <CardDescription>
          Análise de despesas e solicitações por empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleViewReport}
            disabled={loading}
          >
            <Building className="mr-2 h-4 w-4" />
            Ver Relatório por Empresa
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="w-full justify-start" variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                      {format(date.to, "LLL dd, y", { locale: ptBR })}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y", { locale: ptBR })
                  )
                ) : (
                  "Filtrar por Período"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {metrics.length > 0 && (
            <div className="mt-6 space-y-4">
              {metrics.map((metric) => (
                <div key={metric.company} className="space-y-2">
                  <h3 className="font-semibold">{metric.company}</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total de Despesas</p>
                      <p className="font-medium">
                        R$ {metric.totalExpenses.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Solicitações</p>
                      <p className="font-medium">{metric.totalRequests}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Blocos Abertos</p>
                      <p className="font-medium">{metric.openBlocks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
