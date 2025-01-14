/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";
import {
  RequestStatus,
  BlockStatus,
  ExpenseStatus,
  ExpenseCategory,
  PaymentMethod,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export const requestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  amount: z.number().or(z.instanceof(Decimal)),
  currentBalance: z.number(),
  status: z.enum([
    "WAITING",
    "RECEIVED",
    "ACCEPTED",
    "DENIED",
    "COMPLETED",
  ] as const),
  userId: z.string(),
  financeId: z.string().nullable(),
  expectedDate: z.date().nullable(),
  denialReason: z.string().nullable(),
  proofUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  responsibleCompany: z.string(),
  accountingBlock: z
    .object({
      id: z.string(),
      code: z.string(),
      status: z.enum(["OPEN", "CLOSED", "APPROVED", "DENIED"] as const),
      expenses: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          amount: z.number(),
          category: z.enum(
            Object.values(ExpenseCategory) as [
              ExpenseCategory,
              ...ExpenseCategory[],
            ],
          ),
          paymentMethod: z.enum(
            Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]],
          ),
          date: z.string(),
          status: z.enum(
            Object.values(ExpenseStatus) as [ExpenseStatus, ...ExpenseStatus[]],
          ),
          userId: z.string(),
          imageUrls: z.array(z.string()),
          createdAt: z.string(),
          updatedAt: z.string(),
        }),
      ),
      totalAmount: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
});

export type RequestWithBlock = z.infer<typeof requestSchema>;
