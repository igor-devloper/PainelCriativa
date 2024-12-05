"use server";

import { db } from "@/app/_lib/prisma";
import { deleteTeamSchema } from "./schema";
import { revalidatePath } from "next/cache";

export const deleteTeam = async ({ teamId }: deleteTeamSchema) => {
  await db.team.delete({
    where: {
      id: teamId,
    },
  });
  revalidatePath("/");
};
