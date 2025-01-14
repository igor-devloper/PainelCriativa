import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "@/app/_lib/utils";
import { AccountingBlock } from "@/app/types";

export async function getAccountingBlocks(): Promise<AccountingBlock[]> {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);

  const blocks = await db.accountingBlock.findMany({
    where:
      userRole === "USER"
        ? {
            request: {
              userId: userId,
            },
          }
        : undefined,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      request: true,
      expenses: true,
    },
  });

  // Serialize the data before returning
  return JSON.parse(
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
}
