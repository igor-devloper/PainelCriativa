/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getBlockTransactions } from "@/app/_actions/get-block-transactions";
import { formatCurrency } from "@/app/_utils/currency";
import { AddTransactionButton } from "@/app/_components/add-transaction-button";
import { SheetHeader, SheetTitle } from "@/app/_components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Badge } from "./ui/badge";
import { BlockStatus, Transaction, TransactionType } from "@prisma/client";

interface BlockDetailsProps {
  block: {
    id: string;
    name: string;
    amount: number;
    status: string;
  };
  isAdmin: boolean;
  teamId: string;
}

export function BlockDetails({ block, isAdmin, teamId }: BlockDetailsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(block.amount);
  const [status, setStatus] = useState(block.status);

  useEffect(() => {
    getBlockTransactions(block.id).then((fetchedTransactions) => {
      setTransactions(fetchedTransactions);
      const spent = fetchedTransactions.reduce(
        (total, t) => total + Number(t.amount),
        0,
      );
      setBalance(block.amount - spent);
    });
  }, [block.id, block.amount]);
  const updateBalanceAndStatus = (currentTransactions: Transaction[]) => {
    const newBalance = currentTransactions.reduce((total, t) => {
      const amount = Number(t.amount);
      return t.type === TransactionType.EXPENSE
        ? total - amount
        : total + amount;
    }, block.amount);

    setBalance(newBalance);
    setStatus(newBalance === 0 ? BlockStatus.CLOSED : block.status);
  };

  const handleTransactionAdded = (newTransaction: Transaction) => {
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    updateBalanceAndStatus(updatedTransactions);
  };
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>{block.name}</SheetTitle>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium leading-none">Valor Disponível</h3>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(block.amount)}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium leading-none">Saldo Atual</h3>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium leading-none">Status</h3>
          <Badge
            className={`animate-pulse text-sm ${status === BlockStatus.CLOSED ? "bg-red-500" : "bg-green-500"}`}
          >
            {status}
          </Badge>
        </div>
      </div>
      <AddTransactionButton
        isAdmin={isAdmin}
        balance={balance}
        blockId={block.id}
        teamId={teamId}
      />
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Transações</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell>
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
