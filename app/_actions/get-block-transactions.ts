"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export async function getBlockTransactions(blockId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const transactions = await db.transaction.findMany({
    where: {
      blockId: blockId,
      block: {
        team: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions;
}
