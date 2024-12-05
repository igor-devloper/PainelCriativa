import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;
  const { userId } = auth();

  if (!userId) {
    return NextResponse.redirect(
      "/sign-in?redirect_url=" +
        encodeURIComponent(`/api/invitations/${token}`),
    );
  }

  try {
    const invitation = await db.teamInvitation.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Convite expirado" }, { status: 400 });
    }

    // Verificar se o usuário já é membro da equipe
    const existingMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: invitation.teamId,
        },
      },
    });

    if (existingMember) {
      // Se o usuário já é membro, apenas deletamos o convite e redirecionamos
      await db.teamInvitation.delete({
        where: { id: invitation.id },
      });
      return NextResponse.redirect(`/teams/${invitation.teamId}`);
    }

    // Adicionar usuário à equipe
    await db.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: userId,
      },
    });

    // Deletar o convite
    await db.teamInvitation.delete({
      where: { id: invitation.id },
    });

    // Redirecionar para a página da equipe
    return NextResponse.redirect(`/teams/${invitation.teamId}`);
  } catch (error) {
    console.error("Erro ao processar convite:", error);
    return NextResponse.json(
      { error: "Falha ao processar convite" },
      { status: 500 },
    );
  }
}
