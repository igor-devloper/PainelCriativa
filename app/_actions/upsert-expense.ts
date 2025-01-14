"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

interface UpsertExpenseData {
  id?: string;
  name: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: Date;
  blockId: string;
  imageUrls: string[];
}

export async function upsertExpense(data: UpsertExpenseData) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const block = await db.accountingBlock.findUnique({
      where: { id: data.blockId },
    });

    if (!block) {
      throw new Error("AccountingBlock not found");
    }

    const expense = await db.expense.upsert({
      where: {
        id: data.id ?? "",
      },
      create: {
        name: data.name,
        description: data.description,
        amount: new Decimal(data.amount), // Convert number to Decimal
        category: data.category,
        paymentMethod: data.paymentMethod,
        date: data.date,
        blockId: data.blockId,
        userId: userId,
        imageUrls: data.imageUrls,
        status: "WAITING",
      },
      update: {
        name: data.name,
        description: data.description,
        amount: new Decimal(data.amount), // Convert number to Decimal
        category: data.category,
        paymentMethod: data.paymentMethod,
        date: data.date,
        imageUrls: data.imageUrls,
      },
    });

    revalidatePath("/accounting");
    revalidatePath(`/accounting/${data.blockId}`);

    return {
      success: true,
      data: expense,
    };
  } catch (error) {
    console.error("Error upserting expense:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to upsert expense: ${error.message}`);
    } else {
      throw new Error("Failed to upsert expense: Unknown error");
    }
  }
}
