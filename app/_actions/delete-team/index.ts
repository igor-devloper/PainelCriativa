"use server";

import { db } from "@/app/_lib/prisma";
import { deleteTeamSchema } from "./schema";
import { revalidatePath } from "next/cache";

export const deleteTeam = async ({ teamId }: deleteTeamSchema) => {
  try {
    // Start a transaction
    await db.$transaction(async (tx) => {
      // Delete all related team members
      await tx.teamMember.deleteMany({
        where: {
          teamId: teamId,
        },
      });

      // Delete all related transactions
      await tx.transaction.deleteMany({
        where: {
          teamId: teamId,
        },
      });

      // Delete all related blocks
      await tx.block.deleteMany({
        where: {
          teamId: teamId,
        },
      });
      await tx.teamMember.deleteMany({
        where: {
          teamId: teamId,
        },
      });

      await tx.teamInvitation.deleteMany({
        where: {
          id: teamId,
        },
      });
      // Delete the team
      await tx.team.delete({
        where: {
          id: teamId,
        },
      });
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete team:", error);
    return { success: false, error: "Failed to delete team" };
  }
};
