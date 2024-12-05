"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { TeamInvitationEmail } from "../_components/email-templates/TeamInvitationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviteMember(
  teamId: string,
  email: string,
): Promise<{ success: boolean; message: string }> {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  if (team.adminId !== userId) {
    throw new Error("Only team admin can invite members");
  }

  // Check if the user already exists in Clerk
  const existingUsersResponse = await clerkClient.users.getUserList({
    emailAddress: [email],
  });
  const existingUser = existingUsersResponse.data[0];

  if (existingUser) {
    // User exists, add them to the team
    try {
      await db.teamMember.create({
        data: {
          teamId: teamId,
          userId: existingUser.id,
        },
      });
      revalidatePath(`/teams/${teamId}`);
      return { success: true, message: "Member added successfully" };
    } catch (error) {
      if (error) {
        return {
          success: false,
          message: "User is already a member of this team",
        };
      }
      throw error;
    }
  } else {
    // User doesn't exist, create an invitation
    const invitation = await db.teamInvitation.create({
      data: {
        teamId: teamId,
        email: email,
        token: generateInvitationToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    const inviter = await clerkClient.users.getUser(userId);
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitation.token}`;

    // Send invitation email
    try {
      await resend.emails.send({
        from: "Your App <noreply@yourapp.com>",
        to: email,
        subject: `Convite para se juntar à equipe ${team.name}`,
        react: TeamInvitationEmail({
          teamName: team.name,
          inviterName: inviter.firstName ?? "Um membro da equipe",
          invitationLink: invitationLink,
        }),
      });

      revalidatePath(`/teams/${teamId}`);
      return { success: true, message: "Invitation sent successfully" };
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      return { success: false, message: "Failed to send invitation email" };
    }
  }
}

function generateInvitationToken(): string {
  return crypto.randomUUID();
}
