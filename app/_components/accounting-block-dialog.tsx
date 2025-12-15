/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/app/_components/ui/carousel"
import { formatDate, formatCurrency } from "@/app/_lib/utils"
import { Badge } from "@/app/_components/ui/badge"
import type { AccountingBlock, ExpenseItem as Expense, ExpenseCategory, PaymentMethod, BlockStatus } from "@/app/types"
import { AddExpenseButton } from "./add-expense-button"
import { Button } from "@/app/_components/ui/button"
import { closeAccountingBlock } from "@/app/_actions/close-accounting-block"
import { useToast } from "@/app/_hooks/use-toast"
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
} from "@/app/_components/ui/alert-dialog"
import { MoreVertical, Pencil, Trash, Filter, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu"
import { EditExpenseDialog } from "./edit-expense-dialog"
import { deleteExpense } from "@/app/_lib/actions/balance"
import { ReceiptScanner } from "./receipt-scanner"
import { ImprovedPDFGenerator } from "./improved-pdf-generator"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select"

interface AccountingBlockDialogProps {
  block: AccountingBlock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  userRole: string
  userName: string
}

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: "FOODANDBEVERAGE", label: "Alimentação" },
  { value: "ACCOMMODATION", label: "Hospedagem" },
  { value: "TOLL", label: "Pedágio" },
  { value: "FREIGHT", label: "Frete" },
  { value: "POSTAGE", label: "Correios" },
  { value: "PRINTING", label: "Impressão" },
  { value: "FUEL", label: "Combustível" },
  { value: "VEHICLERENTAL", label: "Aluguel de Veículo" },
  { value: "TICKET", label: "Passagem" },
  { value: "AIRTICKET", label: "Passagem Aérea" },
  { value: "BUSTICKET", label: "Passagem de Ônibus" },
  { value: "VEHICLEWASH", label: "Lavagem de Veículo" },
  { value: "ADVANCE", label: "Adiantamento" },
  { value: "SUPPLIES", label: "Material" },
  { value: "OFFICESUPPLIES", label: "Material de Expediente" },
  { value: "OTHER", label: "Outros" },
]

// Função helper para converter valores para número de forma segura
export function safeNumber(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return isNaN(value) ? 0 : value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""))
    return isNaN(parsed) ? 0 : parsed
  }
  // Para Decimal do Prisma
  if (typeof value === "object" && value.toString) {
    const parsed = Number.parseFloat(value.toString())
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

// Funções helper para acessar labels de forma segura
function getCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    FOODANDBEVERAGE: "Alimentação",
    ACCOMMODATION: "Hospedagem",
    TOLL: "Pedágio",
    FREIGHT: "Frete",
    POSTAGE: "Correios",
    PRINTING: "Impressão",
    FUEL: "Combustível",
    VEHICLERENTAL: "Aluguel de Veículo",
    TICKET: "Passagem",
    AIRTICKET: "Passagem Aérea",
    BUSTICKET: "Passagem de Ônibus",
    VEHICLEWASH: "Lavagem de Veículo",
    ADVANCE: "Adiantamento",
    OFFICESUPPLIES: "Material de Escritório",
    SUPPLIES: "Suprimentos",
    OTHER: "Outros",
  }
  return labels[category] || category
}

function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    BANK_TRANSFER: "Transferência Bancária",
    BANK_SLIP: "Boleto",
    CASH: "Dinheiro",
    PIX: "PIX",
    OTHER: "Outros",
  }
  return labels[method] || method
}

function getBlockStatusLabel(status: BlockStatus): string {
  const labels: Record<BlockStatus, string> = {
    OPEN: "Aberto",
    CLOSED: "Fechado",
    APPROVED: "Aprovado",
    DENIED: "Negado",
  }
  return labels[status] || status
}

export function AccountingBlockDialog({
  block,
  open,
  onOpenChange,
  name,
  userRole,
  userName,
}: AccountingBlockDialogProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  const { toast } = useToast()
  const router = useRouter()

  if (!block) return null

  // Separar despesas por tipo
  const despesas = block.expenses.filter((e) => e.type === "DESPESA")
  const caixa = block.expenses.filter((e) => e.type === "CAIXA")
  const reembolso = block.expenses.filter((e) => e.type === "REEMBOLSO")

  const filteredDespesas = despesas.filter((expense) => {
    // Filtro por data de início
    if (filterStartDate) {
      const expenseDate = new Date(expense.date)
      const startDate = new Date(filterStartDate)
      if (expenseDate < startDate) return false
    }

    // Filtro por data de fim
    if (filterEndDate) {
      const expenseDate = new Date(expense.date)
      const endDate = new Date(filterEndDate)
      if (expenseDate > endDate) return false
    }

    // Filtro por categoria
    if (filterCategory && filterCategory !== "all") {
      if (expense.category !== filterCategory) return false
    }

    return true
  })

  const totalDespesas = despesas.reduce((sum, e) => sum + safeNumber(e.amount), 0)
  const totalReembolso = reembolso.reduce((sum, e) => sum + safeNumber(e.amount), 0)
  const totalCaixa = caixa.reduce((sum, e) => sum + safeNumber(e.amount), 0)
  const requestAmount = safeNumber(block.request?.amount)

  // CORREÇÃO: Lógica correta do saldo final
  // Saldo Final = (Valor Disponibilizado + Total Caixa) - Total de Despesas
  const remainingBalance = totalReembolso + requestAmount + totalCaixa - totalDespesas

  const clearFilters = () => {
    setFilterStartDate("")
    setFilterEndDate("")
    setFilterCategory("all")
  }

  const hasActiveFilters = filterStartDate || filterEndDate || (filterCategory && filterCategory !== "all")

  const handleCloseAccounting = async () => {
    try {
      const result = await closeAccountingBlock(block.id)
      if (result.status === "awaiting_reimbursement") {
        toast({
          title: "Reembolso obrigatório",
          description: result.message,
          variant: "destructive",
        })
      } else if (result.status === "closed") {
        toast({
          title: "Fechado com sucesso",
          description: result.message,
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Erro inesperado",
          description: result.message || "Não foi possível fechar o bloco.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro interno",
        description: "Falha ao fechar a prestação. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId)
      toast({
        title: "Despesa removida",
        description: "Registro excluído com sucesso.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    }
  }

  const handleScannerCapture = (file: File) => {
    toast({
      title: "Recibo capturado",
      description: "Imagem capturada com sucesso. Adicione os detalhes da despesa.",
    })
    setShowScanner(false)
  }

  const handleScannerUpload = (files: File[]) => {
    toast({
      title: "Recibos carregados",
      description: `${files.length} arquivo(s) carregado(s) com sucesso.`,
    })
    setShowScanner(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] w-[95vw] max-w-6xl overflow-hidden p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <span className="text-lg sm:text-xl">Prestação de Contas - {block.code}</span>
              <Badge className="mt-2 sm:mt-0">{block.request?.name}</Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh] pr-4">
            {/* Cards de Resumo Melhorados */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    {getBlockStatusLabel(block.status)}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Valor Disponibilizado</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-base font-bold text-blue-600 sm:text-lg">{formatCurrency(requestAmount)}</p>
                  <p className="text-xs text-blue-500">Valor inicial</p>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Total Caixa</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-base font-bold text-green-600 sm:text-lg">{formatCurrency(totalCaixa)}</p>
                  <p className="text-xs text-green-500">{caixa.length} entradas</p>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p
                    className={`text-base font-bold sm:text-lg ${
                      remainingBalance < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(remainingBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {remainingBalance < 0 ? "Reembolso necessário" : "Saldo positivo"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="expenses" className="w-full">
              <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="expenses" className="flex-1 sm:flex-none">
                    Despesas ({filteredDespesas.length}/{despesas.length})
                  </TabsTrigger>
                  <TabsTrigger value="cash" className="flex-1 sm:flex-none">
                    Caixa ({caixa.length})
                  </TabsTrigger>
                  <TabsTrigger value="receipts" className="flex-1 sm:flex-none">
                    Comprovantes
                  </TabsTrigger>
                </TabsList>

                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {/* Botão de Adicionar Despesa */}
                  {block && <AddExpenseButton blockId={block.id} block={block} />}

                  {/* Gerador de PDF Melhorado */}
                  <ImprovedPDFGenerator block={block} userName={userName} companyName={block.company || name} />

                  {/* Botão de Fechar Bloco */}
                  {block.status !== "CLOSED" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Fechar Bloco
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Fechar Prestação de Contas</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você está prestes a fechar este bloco de prestação de contas.
                            {remainingBalance < 0 ? (
                              <p className="mt-2 text-red-500">
                                O saldo final é negativo ({formatCurrency(remainingBalance)}). Uma solicitação de
                                reembolso será criada automaticamente.
                              </p>
                            ) : (
                              <p className="mt-2 text-green-600">
                                O saldo final é positivo ({formatCurrency(remainingBalance)}).
                              </p>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCloseAccounting}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Tab de Despesas */}
              <TabsContent value="expenses">
                <div className="mb-4 space-y-4 rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <h3 className="text-sm font-semibold">Filtros</h3>
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="text-xs">
                          Ativos
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                          <X className="mr-1 h-3 w-3" />
                          Limpar
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-8">
                        {showFilters ? "Ocultar" : "Mostrar"}
                      </Button>
                    </div>
                  </div>

                  {showFilters && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-xs">
                          Data Inicial
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-xs">
                          Data Final
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-xs">
                          Categoria
                        </Label>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                          <SelectTrigger id="category" className="h-9">
                            <SelectValue placeholder="Todas as categorias" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as categorias</SelectItem>
                            {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <ScrollArea className="h-[400px] w-full rounded-md border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Data</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                          <TableHead className="hidden md:table-cell">Método</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDespesas.length > 0 ? (
                          filteredDespesas.map((expense) => (
                            <TableRow
                              key={expense.id}
                              className="cursor-pointer hover:bg-muted"
                              onClick={() => setSelectedExpense(expense)}
                            >
                              <TableCell className="font-medium">{formatDate(expense.date)}</TableCell>
                              <TableCell>{expense.name}</TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {getCategoryLabel(expense.category)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {getPaymentMethodLabel(expense.paymentMethod)}
                              </TableCell>
                              <TableCell className="font-medium text-red-600">
                                {formatCurrency(safeNumber(expense.amount))}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Abrir menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)}>
                                      <Trash className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                              {hasActiveFilters
                                ? "Nenhuma despesa encontrada com os filtros aplicados"
                                : "Nenhuma despesa registrada"}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </TabsContent>

              {/* Tab de Caixa */}
              <TabsContent value="cash">
                <ScrollArea className="h-[400px] w-full rounded-md border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {caixa.map((expense) => (
                          <TableRow key={expense.id} className="cursor-pointer hover:bg-muted">
                            <TableCell className="font-medium">{formatDate(expense.date)}</TableCell>
                            <TableCell>{expense.description || expense.name}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              +{formatCurrency(safeNumber(expense.amount))}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)}>
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

              {/* Tab de Comprovantes */}
              <TabsContent value="receipts">
                {selectedExpense ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                      <h3 className="text-lg font-semibold">Comprovantes - {selectedExpense.name}</h3>
                      <div className="flex gap-2">
                        <Badge>{formatCurrency(safeNumber(selectedExpense.amount))}</Badge>
                        <Badge variant="outline">{getCategoryLabel(selectedExpense.category)}</Badge>
                      </div>
                    </div>

                    {selectedExpense.imageUrls && selectedExpense.imageUrls.length > 0 ? (
                      <Carousel className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                        <CarouselContent>
                          {selectedExpense.imageUrls.map((url, index) => (
                            <CarouselItem key={index}>
                              <div className="p-1">
                                <div className="flex aspect-square items-center justify-center p-2 sm:p-4">
                                  <Image
                                    src={url || "/placeholder.svg"}
                                    alt={`Comprovante ${index + 1}`}
                                    width={400}
                                    height={400}
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

                    {/* Detalhes da despesa */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Detalhes da Despesa</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data:</span>
                          <span>{formatDate(selectedExpense.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Categoria:</span>
                          <span>{getCategoryLabel(selectedExpense.category)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Método:</span>
                          <span>{getPaymentMethodLabel(selectedExpense.paymentMethod)}</span>
                        </div>
                        {selectedExpense.description && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Descrição:</span>
                            <span className="max-w-[200px] text-right">{selectedExpense.description}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Selecione uma despesa para ver seus comprovantes
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog do Scanner */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear Recibo</DialogTitle>
          </DialogHeader>
          <ReceiptScanner onImageCapture={handleScannerCapture} onImageUpload={handleScannerUpload} disabled={false} />
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
