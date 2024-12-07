"use server";

import { db } from "@/app/_lib/prisma";
import { deleteBlockSchema } from "./schema";
import { revalidatePath } from "next/cache";

export const deleteBlock = async ({ blockId, teamId }: deleteBlockSchema) => {
  try {
    // Start a transaction
    await db.$transaction(async (tx) => {
      await tx.block.delete({
        where: {
          id: blockId,
        },
      });
    });
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete team:", error);
    return { success: false, error: "Failed to delete team" };
  }
};
