"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ChartPieProps {
  data: { category: string; value: number }[];
}

// Define consistent colors for each category
const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "hsl(142, 76%, 36%)", // Verde escuro
  Hospedagem: "hsl(199, 89%, 48%)", // Azul
  Pedágio: "hsl(355, 78%, 56%)", // Vermelho
  Frete: "hsl(25, 95%, 53%)", // Laranja
  Correios: "hsl(262, 83%, 58%)", // Roxo
  Impressão: "hsl(46, 97%, 65%)", // Amarelo
  Combustível: "hsl(142, 71%, 45%)", // Verde
  "Aluguel de Veículo": "hsl(199, 95%, 74%)", // Azul claro
  Passagem: "hsl(280, 87%, 65%)", // Roxo claro
  "Passagem Aérea": "hsl(326, 100%, 74%)", // Rosa
  "Passagem Ônibus": "hsl(174, 77%, 31%)", // Verde água
  Lavagem: "hsl(190, 95%, 39%)", // Azul turquesa
  Adiantamento: "hsl(338, 71%, 52%)", // Rosa escuro
  Suprimentos: "hsl(215, 91%, 65%)", // Azul royal
  Outros: "hsl(215, 16%, 47%)", // Cinza azulado
};

export function ChartPie({ data }: ChartPieProps) {
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
        Nenhuma despesa registrada
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            nameKey="category"
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={CATEGORY_COLORS[entry.category] || "hsl(215, 16%, 47%)"}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {data.name}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          R$ {data.value?.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
