"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBlock(
  teamId: string,
  name: string,
  amount: number,
) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team || team.adminId !== userId) {
    throw new Error("Unauthorized");
  }

  const block = await db.block.create({
    data: {
      name,
      amount,
      teamId,
      status: "OPEN",
    },
  });
  revalidatePath(`/teams/${teamId}`);

  return block;
}
