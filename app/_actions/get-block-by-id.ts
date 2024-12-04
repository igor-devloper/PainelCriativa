"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export async function getBlockById(blockId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const block = await db.block.findFirst({
    where: {
      id: blockId,
      team: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return block;
}
