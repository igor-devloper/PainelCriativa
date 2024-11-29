"use client";

import { Transaction } from "@prisma/client";
import { CldImage } from "next-cloudinary";
import { ColumnDef } from "@tanstack/react-table";
import TransactionTypeBadge from "../../transactions/_components/type-badge";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_constants/transactions";
import EditTransactionButton from "../../transactions/_components/edit-transaction-button";
import DeleteTransactionButton from "../../transactions/_components/delete-transaction-button";
import UserInfo from "@/app/_components/user-info";

export const adminColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row: { original: transaction } }) => (
      <TransactionTypeBadge transaction={transaction} />
    ),
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row: { original: transaction } }) =>
      TRANSACTION_CATEGORY_LABELS[transaction.category],
  },
  {
    accessorKey: "paymentMethod",
    header: "Método de Pagamento",
    cell: ({ row: { original: transaction } }) =>
      TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod],
  },
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row: { original: transaction } }) =>
      new Date(transaction.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row: { original: transaction } }) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(transaction.amount)),
  },
  {
    accessorKey: "image",
    header: "Comprovantes",
    cell: ({ row: { original: transaction } }) => {
      const imageUrl = transaction.imageUrl;

      return (
        <div className="space-x-1">
          {imageUrl ? (
            <CldImage
              src={Array.isArray(imageUrl) ? imageUrl[0] : imageUrl}
              width="50"
              height="50"
              crop={{ type: "auto", source: true }}
              alt="Comprovante"
            />
          ) : (
            <div>Sem imagem disponível</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: "Usuário",
    cell: ({ row: { original: transaction } }) => (
      <UserInfo userId={transaction.userId} />
    ),
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row: { original: transaction } }) => {
      return (
        <div className="space-x-1">
          <EditTransactionButton transaction={transaction} />
          <DeleteTransactionButton transactionId={transaction.id} />
        </div>
      );
    },
  },
];
