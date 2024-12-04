"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export async function getUserTeams() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const teams = await db.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return teams;
  } catch (error) {
    console.error("[GET_USER_TEAMS_ERROR]", error);
    throw new Error("Erro ao buscar equipes");
  }
}
