"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { TransactionStatus, BlockStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateTransactionStatus(
  transactionId: string,
  newStatus: TransactionStatus,
) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const updatedTransaction = await db.transaction.update({
      where: { id: transactionId },
      data: { status: newStatus },
    });

    revalidatePath("/admin/dashboard");
    return { success: true, transaction: updatedTransaction };
  } catch (error) {
    console.error("Failed to update transaction status:", error);
    return { success: false, error: "Failed to update transaction status" };
  }
}

export async function updateBlockStatus(
  blockId: string,
  newStatus: BlockStatus,
) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const updatedBlock = await db.block.update({
      where: { id: blockId },
      data: { status: newStatus },
    });

    revalidatePath("/admin/dashboard");
    return { success: true, block: updatedBlock };
  } catch (error) {
    console.error("Failed to update block status:", error);
    return { success: false, error: "Failed to update block status" };
  }
}
