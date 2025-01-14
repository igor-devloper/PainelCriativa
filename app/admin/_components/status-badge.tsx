// import { Badge } from "@/app/_components/ui/badge";
// import { Transaction, TransactionStatus } from "@prisma/client";
// import { Check, CircleIcon } from "lucide-react";

// interface TransactionStatusBadgeProps {
//   transaction: Transaction;
// }

// const TransactionStatusBadge = ({
//   transaction,
// }: TransactionStatusBadgeProps) => {
//   if (transaction.status === TransactionStatus.WAITING) {
//     return (
//       <Badge className="animate-pulse bg-muted font-bold text-yellow-400 hover:bg-yellow-400">
//         <CircleIcon className="mr-2 fill-yellow-400" size={10} />
//         Aguardando
//       </Badge>
//     );
//   }
//   if (transaction.status === TransactionStatus.FINISHED) {
//     return (
//       <Badge className="font bold animate-pulse whitespace-nowrap bg-green-600 bg-opacity-10 text-green-600 hover:bg-green-600">
//         <Check className="mr-2" size={20} />
//         Prestação Aceita
//       </Badge>
//     );
//   }
// };

// export default TransactionStatusBadge;
