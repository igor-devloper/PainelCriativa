"use server";

import { db, executeWithRetry } from "@/app/_lib/prisma";
import { queryWithCache } from "@/app/_lib/db-utils";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { BlockStatus } from "@prisma/client";

export interface DashboardOverviewData {
  pendingRequests: {
    count: number;
    percentageChange: number;
  };
  activeUsers: {
    count: number;
    percentageChange: number;
  };
  accountStatements: {
    count: number;
    percentageChange: number;
  };
  recentActivity: {
    id: string;
    type:
      | "REQUEST_CREATED"
      | "STATEMENT_APPROVED"
      | "USER_REGISTERED"
      | "EXPENSE_CREATED";
    description: string;
    userFullName: string;
    createdAt: Date;
  }[];
}

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Usa cache para reduzir consultas ao banco
  return queryWithCache(
    `dashboard-overview-${userId}`,
    async () => {
      // Get current and previous month date ranges
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      // Executa consultas em paralelo com retry
      const [
        currentPendingRequests,
        previousPendingRequests,
        currentActiveUsers,
        previousActiveUsers,
        currentStatements,
        previousStatements,
        recentActivity,
      ] = await Promise.all([
        executeWithRetry(() =>
          db.request.count({
            where: {
              status: "WAITING",
              createdAt: {
                gte: currentMonthStart,
              },
            },
          }),
        ),
        executeWithRetry(() =>
          db.request.count({
            where: {
              status: "WAITING",
              createdAt: {
                gte: previousMonthStart,
                lt: currentMonthStart,
              },
            },
          }),
        ),
        executeWithRetry(() =>
          db.request
            .groupBy({
              by: ["userId"],
              where: {
                createdAt: {
                  gte: currentMonthStart,
                },
              },
            })
            .then((users) => users.length),
        ),
        executeWithRetry(() =>
          db.request
            .groupBy({
              by: ["userId"],
              where: {
                createdAt: {
                  gte: previousMonthStart,
                  lt: currentMonthStart,
                },
              },
            })
            .then((users) => users.length),
        ),
        executeWithRetry(() =>
          db.accountingBlock.count({
            where: {
              createdAt: {
                gte: currentMonthStart,
              },
            },
          }),
        ),
        executeWithRetry(() =>
          db.accountingBlock.count({
            where: {
              createdAt: {
                gte: previousMonthStart,
                lt: currentMonthStart,
              },
            },
          }),
        ),
        getRecentActivity(previousMonthStart),
      ]);

      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        pendingRequests: {
          count: currentPendingRequests,
          percentageChange: calculatePercentageChange(
            currentPendingRequests,
            previousPendingRequests,
          ),
        },
        activeUsers: {
          count: currentActiveUsers,
          percentageChange: calculatePercentageChange(
            currentActiveUsers,
            previousActiveUsers,
          ),
        },
        accountStatements: {
          count: currentStatements,
          percentageChange: calculatePercentageChange(
            currentStatements,
            previousStatements,
          ),
        },
        recentActivity,
      };
    },
    // Cache por 2 minutos
    120,
  );
}

// Função auxiliar para obter atividade recente
async function getRecentActivity(previousMonthStart: Date) {
  // Executa consultas em paralelo com retry
  const [recentRequests, recentBlocks, recentExpenses] = await Promise.all([
    executeWithRetry(() =>
      db.request.findMany({
        where: {
          createdAt: {
            gte: previousMonthStart,
          },
        },
        select: {
          id: true,
          name: true,
          userId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
      }),
    ),
    executeWithRetry(() =>
      db.accountingBlock.findMany({
        where: {
          status: BlockStatus.APPROVED,
          createdAt: {
            gte: previousMonthStart,
          },
        },
        select: {
          id: true,
          code: true,
          request: {
            select: {
              userId: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 2,
      }),
    ),
    executeWithRetry(() =>
      db.expense.findMany({
        where: {
          createdAt: {
            gte: previousMonthStart,
          },
        },
        select: {
          id: true,
          description: true,
          userId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 2,
      }),
    ),
  ]);

  // Combine and sort recent activity
  const recentActivity = [
    ...recentRequests.map((request) => ({
      id: request.id,
      type: "REQUEST_CREATED" as const,
      description: request.name,
      userId: request.userId,
      createdAt: request.createdAt,
    })),
    ...recentBlocks.map((block) => ({
      id: block.id,
      type: "STATEMENT_APPROVED" as const,
      description: block.code,
      userId: block.request.userId,
      createdAt: block.createdAt,
    })),
    ...recentExpenses.map((expense) => ({
      id: expense.id,
      type: "EXPENSE_CREATED" as const,
      description: expense.description || "Despesa sem descrição",
      userId: expense.userId,
      createdAt: expense.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  // Get user information for recent activity
  const userIds = [
    ...new Set(recentActivity.map((activity) => activity.userId)),
  ];
  const users = await (
    await clerkClient()
  ).users.getUserList({ userId: userIds });
  const userMap = new Map(
    users.data.map((user) => [user.id, `${user.firstName} ${user.lastName}`]),
  );

  return recentActivity.map((activity) => ({
    id: activity.id,
    type: activity.type,
    description: activity.description,
    userFullName: userMap.get(activity.userId) || "Usuário Desconhecido",
    createdAt: activity.createdAt,
  }));
}
