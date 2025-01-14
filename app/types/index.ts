import {
  Request as PrismaRequest,
  AccountingBlock as PrismaAccountingBlock,
  Expense as PrismaExpense,
  RequestStatus as PrismaRequestStatus,
  BlockStatus as PrismaBlockStatus,
  Prisma,
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
  extends Omit<PrismaExpense, "amount" | "date" | "createdAt" | "updatedAt"> {
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

// Update the RequestWithFullDetails type to include the correct expense structure
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
