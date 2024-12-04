"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

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

  // Search for the user by email using Clerk
  const usersResponse = await clerkClient.users.getUserList({
    emailAddress: [email],
  });
  const user = usersResponse.data[0];

  if (user) {
    try {
      await db.teamMember.create({
        data: {
          teamId: teamId,
          userId: user.id,
        },
      });
      revalidatePath(`/teams/${teamId}`);
      return { success: true, message: "Member added successfully" };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          success: false,
          message: "User is already a member of this team",
        };
      }
      throw error;
    }
  } else {
    // Here you should implement the logic to send an email invitation
    console.log(`Sending invitation to ${email}`);
    // TODO: Implement email sending logic
    return { success: true, message: "Invitation sent successfully" };
  }
}
