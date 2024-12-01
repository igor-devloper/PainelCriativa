import { Badge } from "@/app/_components/ui/badge";
import { Transaction, TransactionType } from "@prisma/client";
import { CircleIcon } from "lucide-react";

interface TransactionTypeBadgeProps {
  transaction: Transaction;
}

const TransactionTypeBadge = ({ transaction }: TransactionTypeBadgeProps) => {
  if (transaction.type === TransactionType.DEPOSIT) {
    return (
      <Badge className="bg-muted font-bold text-primary hover:bg-muted">
        <CircleIcon className="mr-2 fill-primary" size={10} />
        Depósito
      </Badge>
    );
  }
  if (transaction.type === TransactionType.EXPENSE) {
    return (
      <Badge className="font bold bg-danger bg-opacity-10 text-danger hover:bg-danger">
        <CircleIcon className="mr-2 fill-danger" size={10} />
        Despesa
      </Badge>
    );
  }
  if (transaction.type === TransactionType.REFUND) {
    return (
      <Badge className="font bold bg-yellow-400 bg-opacity-10 text-yellow-400 hover:bg-yellow-400">
        <CircleIcon className="mr-2 fill-yellow-400" size={10} />
        Reembolso
      </Badge>
    );
  }
};

export default TransactionTypeBadge;
