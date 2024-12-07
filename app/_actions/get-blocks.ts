"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export async function getBlocks() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const AllBlocks = await db.block.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return AllBlocks;
}
