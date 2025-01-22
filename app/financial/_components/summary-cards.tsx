import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { SummaryCard } from "./summary-card";

interface SummaryCardsProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingRequestsAmount: number;
}

export const SummaryCards = ({
  totalRevenue,
  totalExpenses,
  netProfit,
  pendingRequestsAmount,
}: SummaryCardsProps) => {
  return (
    <div className="space-y-6">
      <SummaryCard
        icon={<Wallet size={24} />}
        title="Lucro Líquido"
        amount={netProfit}
        size="large"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<TrendingUp size={16} className="text-primary" />}
          title="Receita Total"
          amount={totalRevenue}
        />
        <SummaryCard
          icon={<TrendingDown size={16} className="text-red-500" />}
          title="Despesas Totais"
          amount={totalExpenses}
        />
        <SummaryCard
          icon={<PiggyBank size={16} />}
          title="Solicitações Pendentes"
          amount={pendingRequestsAmount}
        />
      </div>
    </div>
  );
};
