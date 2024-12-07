/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
import { Badge } from "../../_components/ui/badge";
import { BlockStatus } from "@prisma/client";
import { STATUS_BLOCK_LABEL } from "../../types/block";

interface BlockDetailsProps {
  block: {
    id: string;
    name: string;
    amount: number;
    status: BlockStatus;
  };
  isAdmin: boolean;
  teamId: string;
}

export function BlockDetails({ block, isAdmin, teamId }: BlockDetailsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(block.amount);

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

  const getStatusColor = (status: BlockStatus): string => {
    switch (status) {
      case BlockStatus.APPROVED:
        return "bg-success text-success-foreground";
      case BlockStatus.CLOSED:
        return "bg-destructive text-destructive-foreground";
      case BlockStatus.OPEN:
      default:
        return "bg-secondary text-secondary-foreground";
    }
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
          <h3 className="text-sm font-medium leading-none">Status</h3>
          <Badge className={`${getStatusColor(block.status)}`}>
            {STATUS_BLOCK_LABEL[block.status]}
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
