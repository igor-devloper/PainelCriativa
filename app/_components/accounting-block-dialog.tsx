/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import Image from "next/image";
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
import { ScrollArea } from "@/app/_components/ui/scroll-area";
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
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  EXPENSE_STATUS_LABELS,
  BLOCK_STATUS_LABELS,
} from "@/app/_constants/transactions";
import { Badge } from "@/app/_components/ui/badge";
import { AccountingBlock, Expense } from "@/app/types";
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

interface AccountingBlockDialogProps {
  block: AccountingBlock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountingBlockDialog({
  block,
  open,
  onOpenChange,
}: AccountingBlockDialogProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { toast } = useToast();

  if (!block) return null;

  const totalAmount = block.expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  const remainingBalance = Number(block.request?.amount) - totalAmount;

  const handleCloseAccounting = async () => {
    try {
      const result = await closeAccountingBlock(block.id);
      if (result.success) {
        toast({
          title: "Prestação de contas fechada com sucesso",
          description: `Saldo restante: ${formatCurrency(result.remainingBalance)}. Novo saldo: ${formatCurrency(result.newBalance)}`,
        });
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Erro ao fechar prestação de contas",
        description:
          "Ocorreu um erro ao fechar a prestação de contas. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ScrollArea className="h-[600px]">
        <DialogContent className="max-w-3xl object-cover">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Prestação de Contas - {block.code}</span>
              <Badge className="ml-2">{block.request?.name}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle>Data de Criação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{formatDate(block.createdAt)}</p>
              </CardContent>
            </Card>
            {/* <Card>
                <CardHeader>
                  <CardTitle>Valor Disponibilizado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">
                    {formatCurrency(Number(block.request.amount))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Saldo Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">
                    {formatCurrency(Number(block.request.currentBalance))}
                  </p>
                </CardContent>
              </Card> */}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-lg">
              Saldo disponível:{" "}
              <span className="font-bold">
                {formatCurrency(Number(block.request?.amount))}
              </span>
            </p>
            <p className="text-lg">
              Saldo restante:{" "}
              <span className="font-bold">
                {formatCurrency(remainingBalance)}
              </span>
            </p>
          </div>

          <Tabs defaultValue="expenses" className="w-full">
            <div className="flex items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="expenses">Despesas</TabsTrigger>
                <TabsTrigger value="receipts">Comprovantes</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                {block && ( // Only render if block exists
                  <AddExpenseButton
                    blockId={block.id}
                    block={block} // Pass the entire block object
                  />
                )}
                {block.status !== "CLOSED" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">Fechar Prestação</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Fechar Prestação de Contas
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja fechar esta prestação de
                          contas? Esta ação não pode ser desfeita.
                          {remainingBalance < 0 && (
                            <p className="mt-2 text-red-500">
                              Atenção: O valor das despesas excede o saldo
                              disponível. Isso resultará em um saldo negativo.
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
              <ScrollArea className="h-[200px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {block.expenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedExpense(expense)}
                      >
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{expense.name}</TableCell>
                        <TableCell>
                          {EXPENSE_CATEGORY_LABELS[expense.category]}
                        </TableCell>
                        <TableCell>
                          {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(expense.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              expense.status === "APPROVED"
                                ? "default"
                                : expense.status === "DENIED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {EXPENSE_STATUS_LABELS[expense.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="receipts">
              {selectedExpense ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Comprovantes - {selectedExpense.name}
                    </h3>
                    <Badge>
                      {formatCurrency(Number(selectedExpense.amount))}
                    </Badge>
                  </div>

                  {selectedExpense.imageUrls &&
                  selectedExpense.imageUrls.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <Carousel className="mx-auto w-full max-w-xl">
                        <CarouselContent className="flex items-center justify-center">
                          {selectedExpense.imageUrls.map((url, index) => (
                            <CarouselItem key={index}>
                              <div className="p-1">
                                <div className="flex aspect-square items-center justify-center p-6">
                                  <Image
                                    src={url}
                                    alt={`Comprovante ${index + 1}`}
                                    width={400}
                                    height={400}
                                    className="rounded-md object-contain"
                                  />
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                    </ScrollArea>
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
      </ScrollArea>
    </Dialog>
  );
}
