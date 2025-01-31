/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Request as PrismaRequest,
  AccountingBlock as PrismaAccountingBlock,
  Expense as PrismaExpense,
  RequestStatus as PrismaRequestStatus,
  BlockStatus as PrismaBlockStatus,
  ExpenseCategory,
  PaymentMethod,
  Prisma,
} from "@prisma/client";

import { Decimal } from "@prisma/client/runtime/library"; // Importação do Decimal

// User and Role types
export type UserRole = "ADMIN" | "FINANCE" | "USER";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

export interface FormattedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Stats interface
export interface AdminStats {
  totalUsers: number;
  pendingRequests: number;
  totalApprovedAmount: number;
  openAccountingBlocks: number;
}

// Status types
export type RequestStatus = PrismaRequestStatus;
export type BlockStatus = PrismaBlockStatus;

// Base interfaces extending Prisma types
interface BaseRequest
  extends Omit<PrismaRequest, "amount" | "currentBalance" | "expectedDate"> {
  amount: number; // Converte Decimal para number
  currentBalance: number | null; // Converte Decimal para number
  expectedDate: Date | null;
}

interface BaseAccountingBlock
  extends Omit<
    PrismaAccountingBlock,
    "createdAt" | "updatedAt" | "totalAmount"
  > {
  createdAt: Date;
  updatedAt: Date;
  totalAmount: number; // Converte Decimal para number
}

interface BaseExpense
  extends Omit<PrismaExpense, "amount" | "date" | "createdAt" | "updatedAt"> {
  amount: number; // Converte Decimal para number
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Main interfaces with relationships
export interface Request extends BaseRequest {
  id: string;
  amount: number;
  currentBalance: number | null;
  accountingBlock: AccountingBlock | null;
}

export interface AccountingBlock extends BaseAccountingBlock {
  id: string;
  totalAmount: number;
  expenses: Expense[];
  request: Request | null;
}

export interface Expense extends BaseExpense {
  block?: AccountingBlock;
}

// Serialization-safe interfaces for client-server communication
export interface ExpenseEdit {
  name: string;
  description: string | null;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string;
  imageUrls: string[];
}

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
