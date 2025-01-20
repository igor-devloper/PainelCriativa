"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { ChartArea } from "@/app/_components/chart/chart-area";
import { ChartPie } from "@/app/_components/chart/chart-pie";

interface FinancialOverviewProps {
  data: {
    approvedValues: { month: string; value: number }[];
    expensesByCategory: { category: string; value: number }[];
  };
}

export function FinancialOverview({ data }: FinancialOverviewProps) {
  const { approvedValues, expensesByCategory } = data;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Valores Aprovados</CardTitle>
          <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
        </CardHeader>
        <CardContent>
          <ChartArea data={approvedValues} />
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Despesas por Categoria</CardTitle>
          <p className="text-sm text-muted-foreground">Distribuição atual</p>
        </CardHeader>
        <CardContent>
          <ChartPie data={expensesByCategory} />
        </CardContent>
      </Card>
    </div>
  );
}
