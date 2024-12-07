import { revalidatePath } from "next/cache";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

type Team = {
  id: string;
  name: string;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    members: number;
  };
};

export async function getUserTeams(): Promise<Team[]> {
  const { userId } = auth();
  if (!userId) {
    return [];
  }

  const userTeams = await db.team.findMany({
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
      adminId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { members: true },
      },
    },
  });

  // Adiciona revalidação para o caminho das equipes
  revalidatePath("/teams");

  return userTeams.map((team) => ({
    id: team.id,
    name: team.name,
    adminId: team.adminId,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    _count: {
      members: team._count?.members ?? 0,
    },
  }));
}
