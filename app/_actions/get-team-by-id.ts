"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export async function getTeamById(teamId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const team = await db.team.findFirst({
    where: {
      id: teamId,
      members: {
        some: {
          userId: userId,
        },
      },
    },
  });

  return team;
}
