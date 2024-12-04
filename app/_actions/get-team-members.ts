"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { User } from "@clerk/nextjs/server";

export async function getTeamMembers(teamId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const teamMembers = await db.teamMember.findMany({
    where: {
      teamId: teamId,
    },
  });

  const userIds = teamMembers.map((member) => member.userId);

  // Fetch users in batches to handle pagination
  const allUsers: User[] = [];
  let pageNumber = 1;
  const pageSize = 100; // Adjust this value based on Clerk's API limits

  while (true) {
    const usersResponse = await clerkClient.users.getUserList({
      userId: userIds,
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
    });

    allUsers.push(...usersResponse.data);

    if (usersResponse.data.length < pageSize) {
      break; // We've fetched all users
    }

    pageNumber++;
  }

  return allUsers.map((user: User) => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.emailAddresses[0]?.emailAddress,
    profileImageUrl: user.imageUrl,
  }));
}
