/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/app/_lib/utils";

interface ExpensesByCompanyProps {
  expenseData: {
    company: string;
    amount: number;
  }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const ExpensesByCompany = ({ expenseData }: ExpensesByCompanyProps) => {
  // Custom renderer for the legend text
  const renderLegendText = (value: string, entry: any) => {
    const { payload } = entry;
    return `${payload.company} (${formatCurrency(payload.amount)})`;
  };

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Despesas por Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
              nameKey="company"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {expenseData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Valor"]}
              labelFormatter={(company) => `Empresa: ${company}`}
            />
            <Legend formatter={renderLegendText} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
