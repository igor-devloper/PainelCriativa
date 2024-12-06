"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
// import { revalidatePath } from "next/cache"
// import { unstable_cache } from 'next/cache'

export async function getTeamById(teamId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  console.log(`Fetching team: ${teamId} for user: ${userId}`);

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

  console.log(`Team fetched:`, team);

  return team;
}
