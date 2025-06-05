/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/app/_components/ui/carousel";
import { formatDate, formatCurrency } from "@/app/_lib/utils";

import { Badge } from "@/app/_components/ui/badge";
import type { AccountingBlock, Expense } from "@/app/types";
import { AddExpenseButton } from "./add-expense-button";
import { Button } from "@/app/_components/ui/button";
import { closeAccountingBlock } from "@/app/_actions/close-accounting-block";
import { useToast } from "@/app/_hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
// import { DownloadPDFButton } from "./download-pdf-button";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { deleteExpense } from "@/app/_lib/actions/balance";
import {
  BLOCK_STATUS_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "../_constants/transactions";
import FecharBlocoButton from "./close-accounting-block-button";

interface AccountingBlockDialogProps {
  block: AccountingBlock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  userRole: string;
  userName: string;
}

export function AccountingBlockDialog({
  block,
  open,
  onOpenChange,
  name,
  userRole,
  userName,
}: AccountingBlockDialogProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  if (!block) return null;

  const totalAmount = block.expenses.reduce(
    (total, expense) =>
      expense.type === "CAIXA"
        ? total + Number(expense.amount)
        : total - Number(expense.amount),
    0,
  );

  const remainingBalance = Number(block.currentBalance);

  const handleCloseAccounting = async () => {
    try {
      const result = await closeAccountingBlock(block.id);
      if (result.status === "awaiting_reimbursement") {
        toast({
          title: "Reembolso obrigatório",
          description: result.message,
          variant: "destructive",
        });
      } else if (result.status === "closed") {
        toast({
          title: "Fechado com sucesso",
          description: result.message,
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: "Erro inesperado",
          description: result.message || "Não foi possível fechar o bloco.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro interno",
        description: "Falha ao fechar a prestação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      toast({
        title: "Despesa removida",
        description: "Registro excluído com sucesso.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-5xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <span className="text-lg sm:text-xl">
              Prestação de Contas - {block.code}
            </span>
            <Badge className="mt-2 sm:mt-0">{block.request?.name}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
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
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">
                Data de Criação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-base sm:text-lg">
                {formatDate(block.createdAt)}
              </p>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">
                Valor Disponibilizado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-base font-bold sm:text-lg">
                {formatCurrency(Number(block.request?.amount))}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-base sm:text-lg">
            Saldo:{" "}
            <span className="font-bold">
              {formatCurrency(remainingBalance)}
            </span>
          </p>
        </div>

        <Tabs defaultValue="expenses" className="w-full">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="expenses" className="flex-1 sm:flex-none">
                Despesas
              </TabsTrigger>
              <TabsTrigger value="receipts" className="flex-1 sm:flex-none">
                Comprovantes
              </TabsTrigger>
            </TabsList>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {block && <AddExpenseButton blockId={block.id} block={block} />}
              {/* <DownloadPDFButton
                block={{
                  ...block,
                  request: block.request ?? undefined, // Se for null, transforma em undefined
                  expenses: block.expenses.map((expense) => ({
                    ...expense,
                    date:
                      expense.date instanceof Date
                        ? expense.date.toISOString()
                        : expense.date,
                    description: expense.description ?? "", // Se for null, transforma em string vazia
                  })),
                }}
                userName={userName}
              /> */}
              {block.status !== "CLOSED" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <FecharBlocoButton block={block} />
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Fechar Prestação de Contas
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Você está prestes a fechar este bloco de prestação de
                        contas.
                        {remainingBalance < 0 ? (
                          <p className="mt-2 text-red-500">
                            O saldo final é negativo (
                            {formatCurrency(remainingBalance)}). Uma solicitação
                            de reembolso será criada automaticamente.
                          </p>
                        ) : (
                          <p className="mt-2">
                            O saldo final é de{" "}
                            {formatCurrency(remainingBalance)}.
                          </p>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCloseAccounting}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <TabsContent value="expenses">
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Categoria
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Método
                      </TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {block.expenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedExpense(expense)}
                      >
                        <TableCell className="font-medium">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>{expense.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {EXPENSE_CATEGORY_LABELS[expense.category]}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(expense.amount))}
                        </TableCell>
                        <TableCell>{expense.type}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditExpense(expense)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="receipts">
            {selectedExpense ? (
              <div className="space-y-4">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <h3 className="text-lg font-semibold">
                    Comprovantes - {selectedExpense.name}
                  </h3>
                  <Badge>
                    {formatCurrency(Number(selectedExpense.amount))}
                  </Badge>
                </div>

                {selectedExpense.imageUrls &&
                selectedExpense.imageUrls.length > 0 ? (
                  <Carousel className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                    <CarouselContent>
                      {selectedExpense.imageUrls.map((url, index) => (
                        <CarouselItem key={index}>
                          <div className="p-1">
                            <div className="flex aspect-square items-center justify-center p-2 sm:p-4">
                              <Image
                                src={url || "/placeholder.svg"}
                                alt={`Comprovante ${index + 1}`}
                                width={300}
                                height={300}
                                className="h-auto max-w-full rounded-md object-contain"
                              />
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhum comprovante disponível para esta despesa
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Selecione uma despesa para ver seus comprovantes
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null);
            // You might want to refresh the block data here or update the local state
          }}
        />
      )}
    </Dialog>
  );
}
