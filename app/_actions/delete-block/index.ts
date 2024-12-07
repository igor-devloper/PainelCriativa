"use server";

import { db } from "@/app/_lib/prisma";
import { deleteBlockSchema } from "./schema";

export const deleteBlock = async ({ blockId }: deleteBlockSchema) => {
  try {
    // Start a transaction
    await db.$transaction(async (tx) => {
      await tx.block.delete({
        where: {
          id: blockId,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete team:", error);
    return { success: false, error: "Failed to delete team" };
  }
};
