"use server";

import { PrismaClient } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function getInvitationCount() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    // Get the user's email from Clerk
    const user = clerkClient.users.getUser(userId);
    const email = (await user).emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new Error("User email not found");
    }

    // Count the invitations for this email
    const invitationCount = await prisma.teamInvitation.count({
      where: {
        email: email,
      },
    });

    return invitationCount;
  } catch (error) {
    console.error("Failed to get invitation count:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
