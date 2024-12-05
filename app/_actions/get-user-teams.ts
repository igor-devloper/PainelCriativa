"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export async function getUserTeams() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const teams = await db.team.findMany({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return teams;
}
