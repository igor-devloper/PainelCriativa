"use client";

import { Pie, PieChart } from "recharts";

import { Card, CardContent } from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { TransactionType } from "@prisma/client";
import { TransactionPercentagePerType } from "@/app/_data/get-dashboard/types";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import PercentageItem from "./percentage-item";
import { ScrollArea } from "@/app/_components/ui/scroll-area";

const chartConfig = {
  [TransactionType.DEPOSIT]: {
    label: "Receita",
    color: "#55B02E",
  },
  [TransactionType.EXPENSE]: {
    label: "Despesas",
    color: "#E93030",
  },
} satisfies ChartConfig;

interface TransactionsPieChartProps {
  typesPercentage: TransactionPercentagePerType;
  depositsTotal: number;
  expensesTotal: number;
}

const TransactionsPieChart = ({
  depositsTotal,
  expensesTotal,
  typesPercentage,
}: TransactionsPieChartProps) => {
  // Verifica se todos os valores são zero
  const hasNoData = depositsTotal === 0 && expensesTotal === 0;

  // Configuração de dados do gráfico
  const chartData = hasNoData
    ? [] // Vazio se não houver dados
    : [
        {
          type: TransactionType.DEPOSIT,
          amount: depositsTotal,
          fill: "#55B02E",
        },
        {
          type: TransactionType.EXPENSE,
          amount: expensesTotal,
          fill: "#E93030",
        },
      ];

  return (
    <ScrollArea className="h-full rounded-md border">
      <Card className="flex flex-col p-6">
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            {hasNoData ? (
              <p className="text-center font-bold text-gray-500">Not found</p>
            ) : (
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="type"
                  innerRadius={60}
                />
              </PieChart>
            )}
          </ChartContainer>

          <div className="space-y-3">
            <PercentageItem
              icon={<TrendingUpIcon size={16} className="text-primary" />}
              title="Receita"
              value={hasNoData ? 0 : typesPercentage[TransactionType.DEPOSIT]}
            />
            <PercentageItem
              icon={<TrendingDownIcon size={16} className="text-red-500" />}
              title="Despesas"
              value={hasNoData ? 0 : typesPercentage[TransactionType.EXPENSE]}
            />
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
};

export default TransactionsPieChart;
