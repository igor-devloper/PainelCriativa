/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useState } from "react";
import type { AccountingBlock } from "@/app/types";
import { processAccountingBlock } from "@/app/types";
import { AccountingBlockDialog } from "./accounting-block-dialog";
import { formatDate, formatCurrency } from "@/app/_lib/utils";
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
import { Button } from "@/app/_components/ui/button";
import { Download, Eye, FileText } from "lucide-react";
import Link from "next/link";
import type { BlockStatus } from "@/app/types";

interface AccountingBlocksTableProps {
  blocks: AccountingBlock[];
  name: string;
  userRole: string;
  userName: string;
  onCleanup?: (options: any) => Promise<void>;
  statistics?: {
    totalBlocks: number;
    totalExpenses: number;
    totalRequests: number;
    oldestDate: string;
    totalSize: string;
  };
}

// Função para obter label do status
function getBlockStatusLabel(status: BlockStatus): string {
  const labels: Record<BlockStatus, string> = {
    OPEN: "Aberto",
    CLOSED: "Fechado",
    APPROVED: "Aprovado",
    DENIED: "Negado",
  };
  return labels[status] || status;
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

  const sortedBlocks = [...blocks].sort((a, b) => {
    const dateA =
      a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB =
      b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  // Processar todos os blocos usando a função helper
  const processedBlocks = sortedBlocks.map(processAccountingBlock);

  // Calcular totais de forma segura
  const totals = processedBlocks.reduce(
    (acc, block) => ({
      requestAmount: acc.requestAmount + block.requestAmount,
      remainingBalance: acc.remainingBalance + block.remainingBalance,
      totalDespesas: acc.totalDespesas + block.totalDespesas,
      totalCaixa: acc.totalCaixa + block.totalCaixa,
    }),
    {
      requestAmount: 0,
      remainingBalance: 0,
      totalDespesas: 0,
      totalCaixa: 0,
    },
  );

  const handleRowClick = (block: AccountingBlock) => {
    if (block.status === "CLOSED") {
      return; // Não abre o dialog se estiver fechado
    }
    setSelectedBlock(block);
    setDialogOpen(true);
  };

  const handleViewClosed = (block: AccountingBlock) => {
    setSelectedBlock(block);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Blocos de Prestação</h2>
            <p className="text-muted-foreground">
              {blocks.length} bloco(s) • Total Disponibilizado:{" "}
              {formatCurrency(totals.requestAmount)}
            </p>
          </div>
        </div>

        {/* Resumo rápido - CORRIGIDO */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-600">Total Disponibilizado</p>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(totals.requestAmount)}
            </p>
            <p className="text-xs text-blue-500">Valor inicial + Caixa</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-600">Total Caixa</p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(totals.totalCaixa)}
            </p>
            <p className="text-xs text-green-500">Entradas adicionais</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-600">Total Despesas</p>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(totals.totalDespesas)}
            </p>
            <p className="text-xs text-red-500">Gastos realizados</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Saldo Final</p>
            <p
              className={`text-xl font-bold ${totals.remainingBalance < 0 ? "text-red-700" : "text-green-700"}`}
            >
              {formatCurrency(totals.remainingBalance)}
            </p>
            <p className="text-xs text-gray-500">
              {totals.remainingBalance < 0
                ? "Reembolso necessário"
                : "Saldo positivo"}
            </p>
          </div>
        </div>

        {/* Tabela */}
        <Suspense fallback={<TableSkeleton columns={9} rows={5} showFooter />}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Solicitação</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Disponibilizado</TableHead>
                <TableHead className="text-right">Caixa</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedBlocks.map((block) => {
                const isDisabled = block.status === "CLOSED";
                const originalBlock = sortedBlocks.find(
                  (b) => b.id === block.id,
                )!;

                return (
                  <TableRow
                    key={block.id}
                    className={`${isDisabled ? "cursor-default opacity-80" : "cursor-pointer hover:bg-muted"}`}
                    onClick={() => handleRowClick(originalBlock)}
                  >
                    <TableCell className="font-medium">{block.code}</TableCell>
                    <TableCell>{block.request?.name}</TableCell>
                    <TableCell>{block.company}</TableCell>
                    <TableCell>{formatDate(block.createdAt)}</TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(block.requestAmount)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(block.totalCaixa)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(block.totalDespesas)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center flex-col">
                        <span
                          className={`font-medium ${block.remainingBalance < 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {formatCurrency(block.saldoFinal)}
                        </span>
                        {block.needsReimbursement && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Reembolso
                          </Badge>
                        )}
                      </div>
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
                        {getBlockStatusLabel(block.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {block.status === "CLOSED" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClosed(originalBlock);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {block.pdfUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <Link href={block.pdfUrl} target="_blank">
                                  <Download className="h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(originalBlock);
                            }}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-medium text-blue-600">
                  {formatCurrency(totals.requestAmount)}
                </TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  {formatCurrency(totals.totalCaixa)}
                </TableCell>
                <TableCell className="text-right font-medium text-red-600">
                  {formatCurrency(totals.totalDespesas)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span
                    className={
                      totals.remainingBalance < 0
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {formatCurrency(totals.remainingBalance)}
                  </span>
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </Suspense>
      </div>

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
