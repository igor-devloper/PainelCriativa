/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  Request as PrismaRequest,
  AccountingBlock as PrismaAccountingBlock,
  Expense as PrismaExpense,
  RequestStatus as PrismaRequestStatus,
  BlockStatus as PrismaBlockStatus,
  ExpenseCategory,
  PaymentMethod,
  Prisma,
  transactiontype,
  ExpenseStatus,
  RequestType,
} from "@prisma/client";

import { Decimal } from "@prisma/client/runtime/library";

// User and Role types
export type UserRole = "ADMIN" | "FINANCE" | "USER";

// Status types
export type RequestStatus = PrismaRequestStatus;
export type BlockStatus = PrismaBlockStatus;

export interface AdminStats {
  totalUsers: number;
  pendingRequests: number;
  totalApprovedAmount: number;
  openAccountingBlocks: number;
}

// Main interfaces - VERSÃO ÚNICA E DEFINITIVA
export interface ExpenseRequest {
  id: string;
  name: string;
  description: string;
  amount: number; // Converted from Decimal
  currentBalance?: number | null; // Converted from Decimal
  initialUserBalance?: number; // Converted from Decimal
  balanceDeducted?: number; // Converted from Decimal
  status: RequestStatus;
  userId: string;
  phoneNumber: string;
  type?: RequestType | null;
  financeId?: string | null;
  expectedDate?: Date | null;
  denialReason?: string | null;
  proofUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  accountingBlock?: AccountingBlock | null;
}

export interface ExpenseEdit {
  name: string;
  description: string | null;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string;
  imageUrls: string[];
}

export interface ExpenseItem {
  id: string;
  name: string;
  description?: string | null;
  amount: number; // Converted from Decimal
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  blockId: string;
  date: Date;
  status: ExpenseStatus;
  type: transactiontype;
  userId: string;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  company: string;
}

export interface AccountingBlock {
  id: string;
  code: string;
  requestId?: string | null;
  request?: ExpenseRequest | null; // USAR ExpenseRequest, não Request
  status: BlockStatus;
  pdfUrl?: string | null;
  initialAmount: number; // Converted from Decimal
  currentBalance: number; // Converted from Decimal
  saldoFinal?: number | null; // Converted from Decimal
  expenses: ExpenseItem[];
  createdAt: Date;
  updatedAt: Date;
  company: string;
}

// Tipos auxiliares para trabalhar com os dados processados
export interface ProcessedAccountingBlock extends AccountingBlock {
  // Propriedades calculadas
  totalAmount: number;
  requestAmount: number;
  remainingBalance: number;
  totalDespesas: number;
  totalCaixa: number;
  needsReimbursement: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertPrismaToAccountingBlock(prismaBlock: any): AccountingBlock {
  return {
    id: prismaBlock.id,
    code: prismaBlock.code,
    requestId: prismaBlock.requestId,
    status: prismaBlock.status,
    pdfUrl: prismaBlock.pdfUrl,
    initialAmount: Number(prismaBlock.initialAmount.toString()),
    currentBalance: Number(prismaBlock.currentBalance.toString()),
    saldoFinal: prismaBlock.saldoFinal ? Number(prismaBlock.saldoFinal.toString()) : null,
    createdAt: prismaBlock.createdAt,
    updatedAt: prismaBlock.updatedAt,
    company: prismaBlock.company,
    expenses: prismaBlock.expenses.map((expense: any): ExpenseItem => ({
      id: expense.id,
      name: expense.name,
      description: expense.description,
      amount: Number(expense.amount.toString()),
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      blockId: expense.blockId,
      date: expense.date,
      status: expense.status,
      type: expense.type,
      userId: expense.userId,
      imageUrls: expense.imageUrls,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      company: expense.company,
    })),
    request: prismaBlock.request ? {
      id: prismaBlock.request.id,
      name: prismaBlock.request.name,
      description: prismaBlock.request.description,
      amount: Number(prismaBlock.request.amount.toString()),
      currentBalance: prismaBlock.request.currentBalance ? Number(prismaBlock.request.currentBalance.toString()) : null,
      initialUserBalance: prismaBlock.request.initialUserBalance ? Number(prismaBlock.request.initialUserBalance.toString()) : 0,
      balanceDeducted: prismaBlock.request.balanceDeducted ? Number(prismaBlock.request.balanceDeducted.toString()) : 0,
      status: prismaBlock.request.status,
      userId: prismaBlock.request.userId,
      phoneNumber: prismaBlock.request.phoneNumber,
      type: prismaBlock.request.type,
      financeId: prismaBlock.request.financeId,
      expectedDate: prismaBlock.request.expectedDate,
      denialReason: prismaBlock.request.denialReason,
      proofUrl: prismaBlock.request.proofUrl,
      createdAt: prismaBlock.request.createdAt,
      updatedAt: prismaBlock.request.updatedAt,
      responsibleCompany: prismaBlock.request.responsibleCompany,
      whatsappMessageId: prismaBlock.request.whatsappMessageId,
      whatsappMessageStatus: prismaBlock.request.whatsappMessageStatus,
      whatsappMessageError: prismaBlock.request.whatsappMessageError,
      gestor: prismaBlock.request.gestor,
      responsibleValidationUserID: prismaBlock.request.responsibleValidationUserID,
      bankName: prismaBlock.request.bankName,
      accountType: prismaBlock.request.accountType,
      accountNumber: prismaBlock.request.accountNumber,
      accountHolderName: prismaBlock.request.accountHolderName,
      pixKey: prismaBlock.request.pixKey,
    } : null,
  };
}
// Função helper para converter dados do Prisma para tipos processados
export function processExpense(expense: PrismaExpense): ExpenseItem {
  return {
    id: expense.id,
    name: expense.name,
    description: expense.description,
    amount: expense.amount.toNumber(),
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    blockId: expense.blockId,
    date: expense.date,
    status: expense.status,
    type: expense.type,
    userId: expense.userId,
    imageUrls: expense.imageUrls,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
    company: expense.company,
  };
}

export function processAccountingBlock(
  block: AccountingBlock,
): ProcessedAccountingBlock {
  const processedExpenses = block.expenses;

  const totalDespesas = processedExpenses
    .filter((e) => e.type === "DESPESA")
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalCaixa = processedExpenses
    .filter((e) => e.type === "CAIXA")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalReembolso = processedExpenses
    .filter((e) => e.type === "REEMBOLSO")
    .reduce((sum, e) => sum + e.amount, 0);

  const requestAmount = block.request?.amount ?? 0;
  const remainingBalance = (requestAmount ?? 0) + totalCaixa + totalReembolso - totalDespesas;
  const totalAmount = totalDespesas + totalCaixa + totalReembolso;
  const saldoFinal = remainingBalance;

  return {
    ...block,
    totalAmount,
    requestAmount,
    remainingBalance,
    totalDespesas,
    totalCaixa,
    needsReimbursement: remainingBalance < 0,
    saldoFinal,
  };
}
// Re-exportar tipos do Prisma
export type {
  ExpenseCategory,
  PaymentMethod,
  transactiontype,
  ExpenseStatus,
} from "@prisma/client";

// Prisma payload types
export type RequestWithFullDetails = Prisma.RequestGetPayload<{
  include: {
    accountingBlock: {
      include: {
        expenses: true;
        request: true;
      };
    };
  };
}>;