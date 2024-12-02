import {
  TrendingDownIcon,
  TrendingUpIcon,
  Undo,
  WalletIcon,
} from "lucide-react";
import SummaryCard from "./summary-card";

interface SummaryCards {
  month: string;
  balance: number;
  isAdmin?: boolean;
  depositsTotal: number;
  expensesTotal: number;
  refoundTotal: number;
}

const SummaryCards = async ({
  balance,
  depositsTotal,
  expensesTotal,
  refoundTotal,
  isAdmin,
}: SummaryCards) => {
  return (
    <div className="space-y-6">
      {/* PRIMEIRO CARD */}

      <SummaryCard
        balance={balance}
        icon={<WalletIcon size={16} />}
        title="Saldo"
        isAdmin={isAdmin ?? false}
        amount={balance}
        size="large"
      />

      {/* OUTROS CARDS */}
      <div className="flex w-full flex-col gap-4 md:grid md:grid-cols-3 md:gap-6">
        <SummaryCard
          balance={balance}
          isAdmin={isAdmin ?? false}
          icon={<TrendingUpIcon size={16} className="text-primary" />}
          title="Receita"
          amount={depositsTotal}
        />
        <SummaryCard
          isAdmin={isAdmin ?? false}
          balance={balance}
          icon={<TrendingDownIcon size={16} className="text-red-500" />}
          title="Despesas"
          amount={expensesTotal}
        />
        <SummaryCard
          isAdmin={isAdmin ?? false}
          balance={balance}
          icon={<Undo size={16} className="text-yellow-500" />}
          title="Reembolso"
          amount={refoundTotal}
        />
      </div>
    </div>
  );
};

export default SummaryCards;
