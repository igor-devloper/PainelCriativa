import type {
  ExpenseCategory,
  PaymentMethod,
  RequestStatus,
  BlockStatus,
  ExpenseStatus,
  transactiontype,
} from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export interface Expense {
  id: string;
  name: string;
  description?: string | null;
  amount: number | Decimal;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  blockId: string;
  date: Date; // Mudança: sempre Date para consistência
  status: ExpenseStatus;
  type: transactiontype;
  userId: string;
  imageUrls: string[];
  createdAt: Date; // Mudança: sempre Date
  updatedAt: Date; // Mudança: sempre Date
  company: string;
}

export interface Request {
  id: string;
  name: string;
  description: string;
  amount: number | Decimal;
  currentBalance?: number | Decimal | null;
  initialUserBalance?: number | Decimal | null;
  balanceDeducted?: number | Decimal | null;
  status: RequestStatus;
  userId: string;
  phoneNumber: string;
  financeId?: string | null;
  expectedDate?: Date | null; // Mudança: sempre Date ou null
  denialReason?: string | null;
  proofUrl?: string | null;
  createdAt: Date; // Mudança: sempre Date
  updatedAt: Date; // Mudança: sempre Date
  responsibleCompany: string;
  whatsappMessageId?: string | null;
  whatsappMessageStatus?: string | null;
  whatsappMessageError?: string | null;
  gestor?: string | null;
  responsibleValidationUserID?: string | null;
  bankName?: string | null;
  accountType?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  pixKey?: string | null;
}

export interface AccountingBlock {
  id: string;
  code: string;
  requestId?: string | null;
  request?: Request | null;
  status: BlockStatus;
  pdfUrl?: string | null;
  initialAmount: number | Decimal;
  currentBalance: number | Decimal;
  saldoFinal?: number | Decimal | null;
  expenses: Expense[];
  createdAt: Date; // Mudança: sempre Date
  updatedAt: Date; // Mudança: sempre Date
  company: string;
}

// Tipos auxiliares para trabalhar com os dados processados
export interface ProcessedAccountingBlock {
  id: string;
  code: string;
  requestId?: string | null;
  request?: Request | null;
  status: BlockStatus;
  pdfUrl?: string | null;
  initialAmount: number; // Sempre number
  currentBalance: number; // Sempre number
  saldoFinal: number; // Sempre number
  expenses: ProcessedExpense[]; // Usar ProcessedExpense
  createdAt: Date;
  updatedAt: Date;
  company: string;
  // Propriedades calculadas
  totalAmount: number;
  requestAmount: number;
  remainingBalance: number;
  totalDespesas: number;
  totalCaixa: number;
  needsReimbursement: boolean;
}

export interface ProcessedExpense {
  id: string;
  name: string;
  description?: string | null;
  amount: number; // Sempre number
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  blockId: string;
  date: Date; // Sempre Date
  status: ExpenseStatus;
  type: transactiontype;
  userId: string;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  company: string;
}

// Função helper para converter dados do Prisma para tipos processados
export function processExpense(expense: Expense): ProcessedExpense {
  return {
    ...expense,
    amount:
      typeof expense.amount === "number"
        ? expense.amount
        : Number(expense.amount.toString()),
    date: expense.date instanceof Date ? expense.date : new Date(expense.date),
    createdAt:
      expense.createdAt instanceof Date
        ? expense.createdAt
        : new Date(expense.createdAt),
    updatedAt:
      expense.updatedAt instanceof Date
        ? expense.updatedAt
        : new Date(expense.updatedAt),
  };
}

export function processAccountingBlock(
  block: AccountingBlock,
): ProcessedAccountingBlock {
  const processedExpenses = block.expenses.map(processExpense);

  const totalDespesas = processedExpenses
    .filter((e) => e.type === "DESPESA")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCaixa = processedExpenses
    .filter((e) => e.type === "CAIXA")
    .reduce((sum, e) => sum + e.amount, 0);

  const initialAmount =
    typeof block.initialAmount === "number"
      ? block.initialAmount
      : Number(block.initialAmount.toString());
  const currentBalance =
    typeof block.currentBalance === "number"
      ? block.currentBalance
      : Number(block.currentBalance.toString());
  const saldoFinal = block.saldoFinal
    ? typeof block.saldoFinal === "number"
      ? block.saldoFinal
      : Number(block.saldoFinal.toString())
    : 0;
  const requestAmount = block.request?.amount
    ? typeof block.request.amount === "number"
      ? block.request.amount
      : Number(block.request.amount.toString())
    : 0;
  const totalAmount = totalDespesas + totalCaixa;
  const remainingBalance = requestAmount - totalDespesas + totalCaixa;

  return {
    ...block,
    initialAmount,
    currentBalance,
    saldoFinal,
    expenses: processedExpenses,
    createdAt:
      block.createdAt instanceof Date
        ? block.createdAt
        : new Date(block.createdAt),
    updatedAt:
      block.updatedAt instanceof Date
        ? block.updatedAt
        : new Date(block.updatedAt),
    totalAmount,
    requestAmount,
    remainingBalance,
    totalDespesas,
    totalCaixa,
    needsReimbursement: remainingBalance < 0,
  };
}

// Re-exportar tipos do Prisma para facilitar o uso
export type {
  ExpenseCategory,
  PaymentMethod,
  RequestStatus,
  BlockStatus,
  ExpenseStatus,
  transactiontype,
} from "@prisma/client";
