"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import * as crypto from "crypto";

export async function inviteMember(
  teamId: string,
  email: string,
): Promise<{ success: boolean; message: string }> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, message: "Autenticação necessária" };
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return { success: false, message: "Convidador não encontrado" };
    }

    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return { success: false, message: "Equipe não encontrada" };
    }

    if (team.adminId !== userId) {
      return {
        success: false,
        message: "Apenas o administrador da equipe pode convidar membros",
      };
    }

    const existingInvitation = await db.teamInvitation.findUnique({
      where: {
        email_teamId: {
          email: email,
          teamId: teamId,
        },
      },
    });

    if (existingInvitation) {
      return {
        success: false,
        message: "Um convite já foi enviado para este e-mail para esta equipe",
      };
    }

    await db.teamInvitation.create({
      data: {
        teamId: teamId,
        email: email,
        token: generateInvitationToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    revalidatePath(`/teams/${teamId}`);
    return { success: true, message: "Convite criado com sucesso" };
  } catch (error) {
    console.error("Erro no convite:", error);
    return {
      success: false,
      message: "Falha ao criar o convite",
    };
  }
}

function generateInvitationToken(): string {
  return crypto.randomUUID();
}

export async function acceptInvitation(
  token: string,
): Promise<{ success: boolean; message: string; teamId?: string }> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, message: "Autenticação necessária" };
  }

  try {
    const invitation = await db.teamInvitation.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invitation) {
      return { success: false, message: "Convite não encontrado ou expirado" };
    }

    if (invitation.expiresAt < new Date()) {
      await db.teamInvitation.delete({ where: { id: invitation.id } });
      return { success: false, message: "O convite expirou" };
    }

    const user = await clerkClient.users.getUser(userId);
    if (
      user.emailAddresses.every(
        (email) => email.emailAddress !== invitation.email,
      )
    ) {
      return {
        success: false,
        message: "O e-mail do convite não corresponde à sua conta",
      };
    }

    await db.teamMember.create({
      data: {
        userId,
        teamId: invitation.teamId,
      },
    });

    await db.teamInvitation.delete({ where: { id: invitation.id } });

    revalidatePath(`/teams/${invitation.teamId}`);
    return {
      success: true,
      message: "Você foi adicionado à equipe com sucesso",
      teamId: invitation.teamId,
    };
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    return { success: false, message: "Falha ao aceitar o convite" };
  }
}
