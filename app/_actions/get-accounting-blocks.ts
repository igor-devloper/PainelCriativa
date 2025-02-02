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
      request: {
        select: {
          amount: true,
          bankName: true,
          accountType: true,
          accountNumber: true,
          accountHolderName: true,
          pixKey: true,
        },
      },
      expenses: {
        orderBy: {
          date: "desc",
        },
      },
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
