"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/app/_lib/prisma";

export async function createTeam(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;

  if (!name || name.length < 3) {
    throw new Error("O nome da equipe deve ter pelo menos 3 caracteres");
  }

  try {
    const team = await db.team.create({
      data: {
        name,
        adminId: userId,
        members: {
          create: {
            userId: userId,
          },
        },
      },
    });

    revalidatePath("/teams");
    return { success: true, team };
  } catch (error) {
    console.error("[CREATE_TEAM_ERROR]", error);
    throw new Error("Erro ao criar equipe");
  }
}
