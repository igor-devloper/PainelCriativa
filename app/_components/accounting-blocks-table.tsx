"use client";

import { Suspense, useState } from "react";
import type { AccountingBlock } from "@/app/types";
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
import { TableSkeleton } from "@/app/_components/ui/table-skeleton";

interface AccountingBlocksTableProps {
  blocks: AccountingBlock[];
  name: string;
  userRole: string;
  userName: string;
}

export function AccountingBlocksTable({
  blocks,
  name,
  userRole,
  userName,
}: AccountingBlocksTableProps) {
  const [selectedBlock, setSelectedBlock] = useState<AccountingBlock | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const sortedBlocks = [...blocks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const blocksWithRemainingBalance = sortedBlocks.map((block) => {
    const totalExpenses = block.expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
    const remainingBalance = Number(block.initialAmount) - totalExpenses;
    return { ...block, remainingBalance };
  });

  const totals = blocksWithRemainingBalance.reduce(
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

  return (
    <>
      <Suspense fallback={<TableSkeleton columns={7} rows={5} showFooter />}>
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
                onClick={() => {
                  setSelectedBlock(block);
                  setDialogOpen(true);
                }}
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
      </Suspense>

      <AccountingBlockDialog
        userRole={userRole}
        name={name}
        block={selectedBlock}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userName={userName}
      />
    </>
  );
}
