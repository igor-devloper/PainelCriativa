"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDate, formatCurrency } from "@/app/_lib/utils";
import { ExpenseCategory, PaymentMethod, ExpenseStatus } from "@prisma/client";
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  EXPENSE_STATUS_LABELS,
} from "@/app/_constants/transactions";
import { Badge } from "@/app/_components/ui/badge";

export type Expense = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: Date;
  status: ExpenseStatus;
  imageUrls: string[];
  block: {
    code: string;
    request: {
      name: string;
    };
  };
};

export const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => formatDate(row.getValue("date")),
  },
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => {
      const category = row.getValue("category") as ExpenseCategory;
      return EXPENSE_CATEGORY_LABELS[category];
    },
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => formatCurrency(row.getValue("amount")),
  },
  {
    accessorKey: "paymentMethod",
    header: "Método de Pagamento",
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod") as PaymentMethod;
      return PAYMENT_METHOD_LABELS[method];
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ExpenseStatus;
      const statusColors: Record<
        ExpenseStatus,
        "default" | "secondary" | "destructive"
      > = {
        WAITING: "secondary",
        APPROVED: "default",
        DENIED: "destructive",
      };
      return (
        <Badge variant={statusColors[status]}>
          {EXPENSE_STATUS_LABELS[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "block.code",
    header: "Bloco Contábil",
    cell: ({ row }) => {
      const block = row.original.block;
      return `${block.code} - ${block.request?.name}`;
    },
  },
];
