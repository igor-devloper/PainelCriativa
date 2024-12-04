"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export async function getTeamBlocks(teamId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const blocks = await db.block.findMany({
    where: {
      teamId: teamId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return blocks;
}
