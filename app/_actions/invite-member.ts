/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { TeamInvitationEmail } from "../_components/email-templates/TeamInvitationEmail";
import { clerkClient } from "@clerk/nextjs/server";
import { isAllowedTestEmail } from "@/app/_lib/email-config";
import * as crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviteMember(
  teamId: string,
  email: string,
): Promise<{ success: boolean; message: string }> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, message: "Authentication required" };
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return { success: false, message: "Inviter not found" };
    }

    const inviterName = user.firstName || user.fullName || "Inviter";

    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return { success: false, message: "Team not found" };
    }

    if (team.adminId !== userId) {
      return { success: false, message: "Only team admin can invite members" };
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
        message:
          "An invitation has already been sent to this email for this team",
      };
    }

    const invitation = await db.teamInvitation.create({
      data: {
        teamId: teamId,
        email: email,
        token: generateInvitationToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitation.token}`;

    const emailContent = TeamInvitationEmail({
      teamName: team.name,
      inviterName: inviterName,
      invitationLink: invitationLink,
    });

    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Seu App <noreply@seudominio.com>",
      to:
        process.env.NODE_ENV === "production" || isAllowedTestEmail(email)
          ? email
          : "seu-email-principal@exemplo.com",
      subject: `Convite para se juntar à equipe ${team.name}`,
      react: emailContent,
    });

    revalidatePath(`/teams/${teamId}`);
    return { success: true, message: "Invitation sent successfully" };
  } catch (error) {
    console.error("Invitation error:", error);
    return {
      success: false,
      message: "Failed to create invitation or send email",
    };
  }
}

function generateInvitationToken(): string {
  return crypto.randomUUID();
}
