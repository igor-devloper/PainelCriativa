/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/app/_lib/prisma";
import type { UserRole, Request, RequestWithFullDetails } from "@/app/types";

export async function getRequests(
  userRole: UserRole,
  userId: string,
): Promise<Request[]> {
  try {
    const where: any = {
      OR: [
        { userId: userId }, // My requests
        { gestor: userId }, // Requests where I'm the manager
        { responsibleValidationUserID: userId }, // Requests where I'm the validator
      ],
    };

    // If user is FINANCE or ADMIN, include all authorized requests
    if (userRole === "FINANCE" || userRole === "ADMIN") {
      where.OR.push({ status: { in: ["AUTHORIZES", "ACCEPTS", "COMPLETED"] } });
    }

    const requests = await db.request.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        accountingBlock: {
          include: {
            expenses: {
              orderBy: {
                createdAt: "desc",
              },
            },
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
