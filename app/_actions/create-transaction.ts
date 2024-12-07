/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "../_lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTransaction(formData: FormData) {
  try {
    const transaction = await db.transaction.create({
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as "DEPOSIT" | "EXPENSE",
        amount: parseFloat(formData.get("amount") as string),
        category: formData.get("category") as any,
        paymentMethod: formData.get("paymentMethod") as any,
        date: new Date(formData.get("date") as string),
        userId: formData.get("userId") as string,
        imageUrl: [],
        teamId: formData.get("teamId") as string,
        blockId: formData.get("blockId") as string,
      },
    });

    revalidatePath("/transactions");
    return { success: true, data: transaction };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Failed to create transaction" };
  }
}
