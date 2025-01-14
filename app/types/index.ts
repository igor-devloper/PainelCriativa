/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Request as PrismaRequest,
  AccountingBlock as PrismaAccountingBlock,
  Expense as PrismaExpense,
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
  RequestStatus as PrismaRequestStatus,
  BlockStatus as PrismaBlockStatus,
} from "@prisma/client";

export type UserRole = "ADMIN" | "FINANCE" | "USER";

export interface FormattedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type RequestStatus = PrismaRequestStatus;
export type BlockStatus = PrismaBlockStatus;

interface BaseRequest
  extends Omit<PrismaRequest, "amount" | "currentBalance" | "expectedDate"> {
  amount: number;
  currentBalance: number | null;
  expectedDate: Date | null;
}

interface BaseAccountingBlock
  extends Omit<PrismaAccountingBlock, "createdAt" | "updatedAt"> {
  createdAt: Date;
  updatedAt: Date;
}

interface BaseExpense
  extends Omit<
    PrismaExpense,
    | "amount"
    | "date"
    | "createdAt"
    | "updatedAt"
    | "whatsappMessageId"
    | "whatsappMessageStatus"
    | "whatsappMessageError"
  > {
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  whatsappMessageId?: string | null;
  whatsappMessageStatus?: string | null;
  whatsappMessageError?: string | null;
}

export interface Request extends BaseRequest {
  accountingBlock?: AccountingBlock | null;
}

export interface AccountingBlock extends BaseAccountingBlock {
  request: Request;
  expenses: Expense[];
  totalAmount?: number;
}

export interface Expense extends BaseExpense {
  block?: AccountingBlock;
}

export interface AccountingBlocksListProps {
  accountingBlocks: AccountingBlock[];
  userRole: UserRole;
}

export interface AdminStats {
  totalUsers: number;
  pendingRequests: number;
  totalApprovedAmount: number;
  openAccountingBlocks: number;
}

export interface UserMetadata {
  role: UserRole;
}
