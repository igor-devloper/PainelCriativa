"use server";

import { db } from "@/app/_lib/prisma";
import { UserRole, Request, RequestWithFullDetails } from "@/app/types";

export async function getRequests(
  userRole: UserRole,
  userId: string,
): Promise<Request[]> {
  try {
    const where =
      userRole === "ADMIN" || userRole === "FINANCE" ? undefined : { userId };

    const requests = await db.request.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        accountingBlock: {
          include: {
            expenses: true,
            request: true,
          },
        },
      },
    });

    return requests.map(
      (request: RequestWithFullDetails): Request => ({
        ...request,
        amount: Number(request.amount),
        currentBalance: request.currentBalance
          ? Number(request.currentBalance)
          : null,
        expectedDate: request.expectedDate,
        accountingBlock: request.accountingBlock
          ? {
              ...request.accountingBlock,
              createdAt: request.accountingBlock.createdAt,
              updatedAt: request.accountingBlock.updatedAt,
              totalAmount: request.accountingBlock.expenses.reduce(
                (sum, expense) => sum + Number(expense.amount),
                0,
              ),
              expenses: request.accountingBlock.expenses.map((expense) => ({
                ...expense,
                amount: Number(expense.amount),
                date: expense.date,
                createdAt: expense.createdAt,
                updatedAt: expense.updatedAt,
              })),
              request: request.accountingBlock.request
                ? {
                    ...request.accountingBlock.request,
                    amount: Number(request.accountingBlock.request.amount),
                    currentBalance:
                      request.accountingBlock.request.currentBalance != null
                        ? Number(request.accountingBlock.request.currentBalance)
                        : null,
                    expectedDate: request.accountingBlock.request.expectedDate,
                    accountingBlock: null, // Avoid circular reference
                  }
                : null,
            }
          : null,
      }),
    );
  } catch (error) {
    console.error("Error fetching requests:", error);
    throw new Error("Failed to fetch requests");
  }
}
