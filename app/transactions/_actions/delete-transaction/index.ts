"use server";

import { db } from "@/app/_lib/prisma";
import { DeleteTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

export const deleteTransaction = async ({
  transactionId,
  blockId,
}: DeleteTransactionSchema) => {
  try {
    // First, check if the transaction exists
    const transaction = await db.transaction.findUnique({
      where: {
        id: transactionId,
        blockId: blockId,
      },
    });

    if (!transaction) {
      // If the transaction doesn't exist, return early
      console.log(`Transaction with id ${transactionId} not found.`);
      return;
    }

    // If the transaction exists, delete it
    await db.transaction.delete({
      where: {
        id: transactionId,
        blockId: blockId,
      },
    });

    // Revalidate paths
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true, message: "Transaction deleted successfully." };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, message: "Failed to delete transaction." };
  }
};
