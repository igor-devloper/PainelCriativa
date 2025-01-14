"use server";

import { db } from "@/app/_lib/prisma";
import { UserRole, Request } from "@/app/types";
import { Prisma } from "@prisma/client";

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

    // Convert Decimal to number and ensure all fields match the Request interface
    return requests.map((request) => ({
      ...request,
      amount: Number(request.amount),
      currentBalance: request.currentBalance
        ? Number(request.currentBalance)
        : null,
      accountingBlock: request.accountingBlock
        ? {
            ...request.accountingBlock,
            totalAmount: request.accountingBlock.expenses.reduce(
              (sum, expense) => sum + Number(expense.amount),
              0,
            ),
          }
        : null,
    }));
  } catch (error) {
    console.error("Error fetching requests:", error);
    throw new Error("Failed to fetch requests");
  }
}

// Define the full type including all relations
export type RequestWithFullDetails = Prisma.RequestGetPayload<{
  include: {
    accountingBlock: {
      include: {
        expenses: true;
        request: true;
      };
    };
  };
}>;
