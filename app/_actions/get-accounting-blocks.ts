import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "@/app/_lib/utils";
import { AccountingBlock } from "@/app/types";
import { redis } from "../_lib/redis";

export async function getAccountingBlocks(): Promise<AccountingBlock[]> {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }
  const cacheKey = `accounting-blocks:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached as string) as AccountingBlock[];
  }
  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);

  // Define a condição where baseada no role do usuário
  const where =
    userRole === "ADMIN" || userRole === "FINANCE"
      ? undefined // Sem filtro para admin e finance (mostrar todos)
      : {
          request: {
            userId: userId, // Filtrar apenas blocos do usuário
          },
        };

  const blocks = await db.accountingBlock.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      request: true,
      expenses: {
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      },
    },
    take: 20,
  });

  // Serialize the data before returning
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

  await redis.set(cacheKey, JSON.stringify(processedBlocks), {
    ex: 60, // Cache for 1 minute
  });

  return processedBlocks;
}
