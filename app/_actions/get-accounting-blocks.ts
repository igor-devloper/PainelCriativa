"use server";

import { db, executeWithRetry } from "@/app/_lib/prisma";
import { queryWithCache } from "@/app/_lib/db-utils";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "@/app/_lib/utils";
import type { AccountingBlock } from "@/app/types";

export async function getAccountingBlocks(): Promise<AccountingBlock[]> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Usa cache para reduzir consultas ao banco
  return queryWithCache(
    `accounting-blocks-${userId}`,
    async () => {
      const user = await (await clerkClient()).users.getUser(userId);
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

      // Executa a consulta com retry
      const blocks = await executeWithRetry(() =>
        db.accountingBlock.findMany({
          where,
          include: {
            request: true,
            expenses: {
              orderBy: {
                date: "desc",
              },
              take: 50,
            },
          },
          take: 20,
        }),
      );

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
    },
    // Cache por 1 minuto
    60,
  );
}
