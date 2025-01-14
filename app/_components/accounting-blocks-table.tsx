"use client";

import { useState } from "react";
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
} from "@/app/_components/ui/table";

interface AccountingBlocksTableProps {
  blocks: AccountingBlock[];
}

export function AccountingBlocksTable({ blocks }: AccountingBlocksTableProps) {
  const [selectedBlock, setSelectedBlock] = useState<AccountingBlock | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (block: AccountingBlock) => {
    setSelectedBlock(block);
    setDialogOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Solicitação</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blocks.map((block) => (
            <TableRow
              key={block.id}
              className="cursor-pointer hover:bg-muted"
              onClick={() => handleRowClick(block)}
            >
              <TableCell>{block.code}</TableCell>
              <TableCell>{block.request?.name}</TableCell>
              <TableCell>{formatDate(block.createdAt)}</TableCell>
              <TableCell>
                {formatCurrency(
                  Number(block.request?.amount) -
                    Number(block.request?.currentBalance),
                )}
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
      </Table>

      <AccountingBlockDialog
        block={selectedBlock}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
