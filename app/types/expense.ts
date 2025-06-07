import type {
  ExpenseCategory,
  PaymentMethod,
  RequestStatus,
  BlockStatus,
  ExpenseStatus,
} from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export interface Expense {
  date: string;
  name: string;
  amount: number | Decimal;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  description: string;
  imageUrls?: string[];
  type?: string;
}

export interface AccountingBlock {
  code: string;
  createdAt: string | Date;
  status: BlockStatus;
  initialAmount?: number | Decimal;
  expenses: Expense[];
  request?: {
    status: RequestStatus;
    amount: number | Decimal;
    bankName?: string | null;
    accountType?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
    pixKey?: string | null;
  };
}
