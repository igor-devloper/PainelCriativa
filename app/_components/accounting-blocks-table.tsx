"use client";

import { useState, useMemo } from "react";
import { AccountingBlock } from "@/app/types";
import { AccountingBlockDialog } from "./accounting-block-dialog";
import { formatDate, formatCurrency } from "@/app/_lib/utils";
import { BLOCK_STATUS_LABELS } from "@/app/_constants/transactions";
import { Badge } from "@/app/_components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/app/_components/ui/table";

interface AccountingBlocksTableProps {
  blocks: AccountingBlock[];
  name: string;
  userRole: string;
}

export function AccountingBlocksTable({
  blocks,
  name,
  userRole,
}: AccountingBlocksTableProps) {
  const [selectedBlock, setSelectedBlock] = useState<AccountingBlock | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (block: AccountingBlock) => {
    setSelectedBlock(block);
    setDialogOpen(true);
  };

  const sortedBlocks = useMemo(() => {
    return [...blocks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [blocks]);

  const blocksWithRemainingBalance = useMemo(() => {
    return sortedBlocks.map((block) => {
      const totalExpenses = block.expenses.reduce(
        (total, expense) => total + Number(expense.amount),
        0,
      );
      const remainingBalance = Number(block.initialAmount) - totalExpenses;
      return { ...block, remainingBalance };
    });
  }, [sortedBlocks]);

  const totals = useMemo(() => {
    return blocksWithRemainingBalance.reduce(
      (acc, block) => ({
        initialAmount: acc.initialAmount + Number(block.initialAmount),
        currentBalance: acc.currentBalance + Number(block.request?.amount),
        remainingBalance: acc.remainingBalance + block.remainingBalance,
      }),
      {
        initialAmount: 0,
        currentBalance: 0,
        remainingBalance: 0,
      },
    );
  }, [blocksWithRemainingBalance]);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Solicitação</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead className="text-right">Valor Solicitado</TableHead>
            <TableHead className="text-right">Saldo Restante</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blocksWithRemainingBalance.map((block) => (
            <TableRow
              key={block.id}
              className="cursor-pointer hover:bg-muted"
              onClick={() => handleRowClick(block)}
            >
              <TableCell>{block.code}</TableCell>
              <TableCell>{block.request?.name}</TableCell>
              <TableCell>{block.company}</TableCell>
              <TableCell>{formatDate(block.createdAt)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(Number(block.initialAmount))}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(block.remainingBalance)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    block.status === "APPROVED"
                      ? "default"
                      : block.status === "DENIED"
                        ? "destructive"
                        : block.status === "CLOSED"
                          ? "secondary"
                          : "outline"
                  }
                >
                  {BLOCK_STATUS_LABELS[block.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right">
              {formatCurrency(totals.initialAmount)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(totals.remainingBalance)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>

      <AccountingBlockDialog
        userRole={userRole}
        name={name}
        block={selectedBlock}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
