/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import UpsertTransactionAdminDialog from "@/app/_components/upsert-expense-dialog";
// import { getBlockTransactions } from "@/app/_actions/get-block-transactions";
// import {
//   updateTransactionStatus,
//   updateBlockStatus,
// } from "@/app/_actions/update-statuses";
// import {
//   Block,
//   Transaction,
//   BlockStatus,
//   TransactionStatus,
//   Team,
// } from "@prisma/client";
import { auth, clerkClient, User } from "@clerk/nextjs/server";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Package2, Search, Filter, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/_components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { STATUS_BLOCK_LABEL } from "@/app/types/block";
import { toast } from "@/app/_hooks/use-toast";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_OPTIONS_LABELS,
} from "@/app/_constants/transactions";
import UserInfo from "@/app/_components/user-info";
import { ImageGallery } from "@/app/transactions/_components/image-gallery";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import { getUserRole } from "@/app/_lib/utils";
import { getPendingRequestsCount } from "@/app/_actions/get-pending-requests-count";
import { redirect } from "next/navigation";
import Link from "next/link";

interface AdmProps {
  userRole: "ADMIN" | "FINANCE" | "USER";
  pendingRequestsCount: number;
}

export async function AdminDashboardClient({
  pendingRequestsCount,
  userRole,
}: AdmProps) {
  // const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  // const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  // const [transactions, setTransactions] = useState<{
  //   [blockId: string]: TransactionWithUser[];
  // }>({});
  // const [balances, setBalances] = useState<{ [blockId: string]: number }>({});
  // const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   initialBlocks.forEach((block) => {
  //     fetchBlockTransactions(block.id);
  //   });
  // }, [initialBlocks]);

  // const fetchBlockTransactions = async (blockId: string) => {
  //   try {
  //     const fetchedTransactions = await getBlockTransactions(blockId);
  //     setTransactions((prev) => ({ ...prev, [blockId]: fetchedTransactions }));
  //     const spent = fetchedTransactions.reduce(
  //       (total, t) => total + Number(t.amount),
  //       0,
  //     );
  //     setBalances((prev) => ({
  //       ...prev,
  //       [blockId]: Number(blocks.find((b) => b.id === blockId)?.amount) - spent,
  //     }));
  //   } catch (error) {
  //     console.error(
  //       `Failed to fetch transactions for block ${blockId}:`,
  //       error,
  //     );
  //     toast({
  //       title: "Erro",
  //       description:
  //         "Falha ao carregar as transações. Por favor, tente novamente.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const handleStatusChange = async (
  //   transactionId: string,
  //   newStatus: TransactionStatus,
  // ) => {
  //   setIsLoading(true);
  //   try {
  //     const result = await updateTransactionStatus(transactionId, newStatus);
  //     if (result.success) {
  //       setTransactions((prev) => {
  //         const updatedTransactions = { ...prev };
  //         Object.keys(updatedTransactions).forEach((blockId) => {
  //           updatedTransactions[blockId] = updatedTransactions[blockId].map(
  //             (t) => (t.id === transactionId ? { ...t, status: newStatus } : t),
  //           );
  //         });
  //         return updatedTransactions;
  //       });
  //       toast({
  //         title: "Sucesso",
  //         description: "Status da transação atualizado com sucesso.",
  //       });
  //     } else {
  //       throw new Error(result.error);
  //     }
  //   } catch (error) {
  //     console.error("Failed to update transaction status:", error);
  //     toast({
  //       title: "Erro",
  //       description:
  //         "Falha ao atualizar o status da transação. Por favor, tente novamente.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleBlockStatusChange = async (
  //   blockId: string,
  //   newStatus: BlockStatus,
  // ) => {
  //   setIsLoading(true);
  //   try {
  //     const result = await updateBlockStatus(blockId, newStatus);
  //     if (result.success) {
  //       setBlocks((prev) =>
  //         prev.map((b) => (b.id === blockId ? { ...b, status: newStatus } : b)),
  //       );
  //       toast({
  //         title: "Sucesso",
  //         description: "Status do bloco atualizado com sucesso.",
  //       });
  //     } else {
  //       throw new Error(result.error);
  //     }
  //   } catch (error) {
  //     console.error("Failed to update block status:", error);
  //     toast({
  //       title: "Erro",
  //       description:
  //         "Falha ao atualizar o status do bloco. Por favor, tente novamente.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole}
        pendingRequestsCount={pendingRequestsCount}
      />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
          </header>
          <ScrollArea>
            <main className="flex-1 space-y-4 p-8">
              <div>
                <div className="flex h-16 items-center gap-4 px-4">
                  <Package2 className="h-6 w-6" />
                  <h1 className="text-xl font-semibold">Dashboard Admin</h1>
                </div>
                <Link href="/admin/users">
                  <Button>Gerenciar Usuarios</Button>
                </Link>
              </div>

              {/* <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." className="pl-8" />
                </div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </div> */}

              {/* <Card>
                <CardHeader>
                  <CardTitle>Blocos de Transações</CardTitle>
                  <CardDescription>
                    Gerencie todos os blocos e suas transações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {blocks.map((block) => (
                      <AccordionItem key={block.id} value={block.id}>
                        <AccordionTrigger className="px-4">
                          <div className="flex w-full items-center justify-between">
                            <span>{block.name}</span>
                            <div className="mr-4 flex items-center gap-4">
                              <Badge
                                variant={
                                  block.status === "OPEN" ||
                                  block.status === "APPROVED"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {STATUS_BLOCK_LABEL[block.status]}
                              </Badge>
                              <Select
                                onValueChange={(value) =>
                                  handleBlockStatusChange(
                                    block.id,
                                    value as BlockStatus,
                                  )
                                }
                                defaultValue={block.status}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="Alterar status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="OPEN">Ativo</SelectItem>
                                  <SelectItem value="CLOSED">
                                    Fechado
                                  </SelectItem>
                                  <SelectItem value="APPROVED">
                                    Prestação aprovada
                                  </SelectItem>
                                  <SelectItem value="REPROVED">
                                    Prestação Reprovada
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead>Categoria</TableHead>
                                  <TableHead>Método de Pagamento</TableHead>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Valor</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Usuário</TableHead>
                                  <TableHead>Comprovantes</TableHead>
                                  <TableHead className="text-right">
                                    Ações
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {transactions[block.id]?.map((transaction) => (
                                  <TableRow key={transaction.id}>
                                    <TableCell>{transaction.name}</TableCell>
                                    <TableCell>
                                      {
                                        TRANSACTION_TYPE_OPTIONS_LABELS[
                                          transaction.type
                                        ]
                                      }
                                    </TableCell>
                                    <TableCell>
                                      {
                                        TRANSACTION_CATEGORY_LABELS[
                                          transaction.category
                                        ]
                                      }
                                    </TableCell>
                                    <TableCell>
                                      {
                                        TRANSACTION_PAYMENT_METHOD_LABELS[
                                          transaction.paymentMethod
                                        ]
                                      }
                                    </TableCell>
                                    <TableCell>
                                      {transaction.date.toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      {new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      }).format(Number(transaction.amount))}
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        onValueChange={(value) =>
                                          handleStatusChange(
                                            transaction.id,
                                            value as TransactionStatus,
                                          )
                                        }
                                        defaultValue={String(
                                          transaction.status,
                                        )}
                                      >
                                        <SelectTrigger className="w-[130px]">
                                          <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="WAITING">
                                            Aguardando
                                          </SelectItem>
                                          <SelectItem value="FINISHED">
                                            Prestação Aceita
                                          </SelectItem>
                                          <SelectItem value="REPROVED">
                                            Prestação Reprovada
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <UserInfo userId={transaction.userId} />
                                    </TableCell>
                                    <TableCell>
                                      <ImageGallery
                                        images={transaction.imageUrl}
                                      />
                                      ;
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">
                                              Abrir menu
                                            </span>
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem>
                                            Ver detalhes
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive">
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
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card> */}
            </main>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* <UpsertTransactionAdminDialog
            onLoadingChange={setIsLoading}
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            blockId={selectedBlock || ""}
            teamId={initialUserTeams[0]?.id || ""}
          /> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
