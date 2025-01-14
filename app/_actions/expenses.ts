"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";

export async function createExpense(blockId: string, formData: FormData) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const amount = formData.get("amount") as string;
  const category = formData.get("category") as ExpenseCategory;
  const paymentMethod = formData.get("paymentMethod") as PaymentMethod;
  const date = formData.get("date") as string;
  const imageUrls = formData.getAll("imageUrls") as string[];

  if (!name || !amount || !category || !paymentMethod || !date) {
    throw new Error("Missing required fields");
  }

  const expense = await db.expense.create({
    data: {
      name,
      description,
      amount: parseFloat(amount),
      category,
      paymentMethod,
      date: new Date(date),
      blockId,
      userId,
      imageUrls,
    },
  });

  revalidatePath(`/blocks/${blockId}`);
  return expense;
}

export async function updateExpenseStatus(
  expenseId: string,
  status: "APPROVED" | "DENIED",
) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const expense = await db.expense.update({
    where: { id: expenseId },
    data: { status },
  });

  revalidatePath(`/blocks/${expense.blockId}`);
  return expense;
}
