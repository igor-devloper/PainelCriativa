import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;
  const { userId } = auth();

  if (!userId) {
    // Redirecionar para a página de login se o usuário não estiver autenticado
    return NextResponse.redirect(
      "/sign-in?redirect_url=" +
        encodeURIComponent(`/api/invitations/${token}`),
    );
  }

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

  // Verificar se o email do convite corresponde ao email do usuário autenticado
  const user = await clerkClient.users.getUser(userId);
  const userEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (userEmail !== invitation.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
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
    console.error("Erro ao aceitar convite:", error);
    return NextResponse.json(
      { error: "Falha ao aceitar convite" },
      { status: 500 },
    );
  }
}
