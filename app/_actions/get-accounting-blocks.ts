import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "@/app/_lib/utils";
import type { AccountingBlock } from "@/app/types";
import { redis } from "../_lib/redis";
import { DatabaseError } from "@/app/_lib/errors";

export async function getAccountingBlocks(): Promise<AccountingBlock[]> {
  try {
    const { userId } = auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Try to get from cache first
    const cacheKey = `accounting-blocks:${userId}`;
    try {
      const cached = await redis.get(cacheKey);
      // Add type check for cached data
      if (cached && typeof cached === "string") {
        return JSON.parse(cached) as AccountingBlock[];
      }
    } catch (error) {
      console.error("Cache error:", error);
      // Continue execution even if cache fails
    }

    // Get user role
    const user = await clerkClient.users.getUser(userId);
    const userRole = getUserRole(user.publicMetadata);

    // Define query conditions
    const where =
      userRole === "ADMIN" || userRole === "FINANCE"
        ? undefined
        : { request: { userId } };

    try {
      const blocks = await db.accountingBlock.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          request: true,
          expenses: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      const processedBlocks = JSON.parse(
        JSON.stringify(
          blocks.map((block) => ({
            ...block,
            totalAmount: block.expenses.reduce(
              (sum, expense) => sum + Number(expense.amount),
              0,
            ),
          })),
        ),
      );

      // Type check the data before caching
      await redis.set(cacheKey, JSON.stringify(processedBlocks), {
        ex: 60,
      });

      return processedBlocks;
    } catch (error) {
      console.error("Database error:", error);
      throw new DatabaseError();
    }
  } catch (error) {
    console.error("Error fetching accounting blocks:", error);
    throw error;
  }
}
