"use client";

import { Transaction } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import TransactionTypeBadge from "../../transactions/_components/type-badge";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_constants/transactions";
import DeleteTransactionButton from "../../transactions/_components/delete-transaction-button";
import UserInfo from "@/app/_components/user-info";
import { ImageGallery } from "@/app/transactions/_components/image-gallery";
import TransactionStatusBadge from "../_components/status-badge";
import UpdateTransactionAdmin from "../_components/upadated-transaction-admin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { MoreHorizontal } from "lucide-react";

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
    accessorKey: "imageUrl",
    header: "Comprovantes",
    cell: ({ row }) => {
      const imageUrls = row.original.imageUrl;
      return <ImageGallery images={imageUrls} />;
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row: { original: transaction } }) => (
      <TransactionStatusBadge transaction={transaction} />
    ),
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row: { original: transaction } }) => {
      return (
        <div className="">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring"
              >
                <MoreHorizontal
                  className="h-4 w-4 text-muted-foreground"
                  size={10}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="flex w-full flex-col items-center justify-center space-y-4">
              <UpdateTransactionAdmin transaction={transaction} />
              <DeleteTransactionButton transactionId={transaction.id} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
