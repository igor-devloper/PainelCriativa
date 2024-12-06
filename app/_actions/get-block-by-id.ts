"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { unstable_cache } from "next/cache";

export async function getBlockNameById(blockId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return unstable_cache(
    async () => {
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
          name: true,
        },
      });

      if (!block) {
        throw new Error("Block not found or access denied");
      }

      return block.name;
    },
    [`block-name-${blockId}-${userId}`],
    {
      revalidate: 0,
      tags: [`block-${blockId}`],
    },
  )();
}
