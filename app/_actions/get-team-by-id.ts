import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export async function getTeamById(teamId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Não autorizado");
  }

  console.log(`Buscando equipe: ${teamId} para o usuário: ${userId}`);

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

  console.log(`Equipe encontrada:`, team);

  // Adiciona revalidação para o caminho da equipe
  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");

  return team;
}
