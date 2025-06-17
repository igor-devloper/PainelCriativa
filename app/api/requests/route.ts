/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { UserRole } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 3;
  const userRole = searchParams.get("userRole") as UserRole;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const where: any = {
      OR: [
        { userId: userId },
        { gestor: userId },
        { responsibleValidationUserID: userId },
      ],
    };

    if (userRole === "FINANCE" || userRole === "ADMIN") {
      where.OR.push({ status: { in: ["AUTHORIZES", "ACCEPTS", "COMPLETED"] } });
    }

    const [requests, totalCount] = await Promise.all([
      db.request.findMany({
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.request.count({ where }),
    ]);

    // Transform the data
    const transformedRequests = requests.map((request) => ({
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
            expenses: request.accountingBlock.expenses.map((expense) => ({
              ...expense,
              amount: Number(expense.amount),
            })),
          }
        : null,
    }));

    // Set cache headers
    const headers = {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
    };

    return NextResponse.json(
      { requests: transformedRequests, totalCount },
      { headers },
    );
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
