"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/app/_lib/prisma";

export async function createTeam(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Não autorizado");
  }

  const name = formData.get("name") as string;

  if (!name || name.length < 3) {
    throw new Error("O nome da equipe deve ter pelo menos 3 caracteres");
  }

  try {
    // Verifica se o usuário já está em uma equipe
    const existingTeam = await db.team.findFirst({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (existingTeam) {
      throw new Error(
        "Você já faz parte de uma equipe. Não é possível criar ou participar de outra.",
      );
    }

    // Se o usuário não está em nenhuma equipe, cria uma nova
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
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Erro ao criar equipe");
    }
  }
}
