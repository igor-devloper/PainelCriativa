"use server";

import { db } from "@/app/_lib/prisma";
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
    type: "REQUEST_CREATED" | "STATEMENT_APPROVED" | "USER_REGISTERED";
    description: string;
    userFullName: string;
    createdAt: Date;
  }[];
}

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get current and previous month date ranges
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get pending requests counts
  const [currentPendingRequests, previousPendingRequests] = await Promise.all([
    db.request.count({
      where: {
        status: "WAITING",
        createdAt: {
          gte: currentMonthStart,
        },
      },
    }),
    db.request.count({
      where: {
        status: "WAITING",
        createdAt: {
          gte: previousMonthStart,
          lt: currentMonthStart,
        },
      },
    }),
  ]);

  // Get active users (users who have made requests in the last month)
  const [currentActiveUsers, previousActiveUsers] = await Promise.all([
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
  ]);

  // Get account statements counts
  const [currentStatements, previousStatements] = await Promise.all([
    db.accountingBlock.count({
      where: {
        createdAt: {
          gte: currentMonthStart,
        },
      },
    }),
    db.accountingBlock.count({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lt: currentMonthStart,
        },
      },
    }),
  ]);

  // Get recent activity using Prisma queries instead of raw SQL
  const [recentRequests, recentBlocks] = await Promise.all([
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
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  // Get user information for recent activity
  const userIds = [
    ...new Set(recentActivity.map((activity) => activity.userId)),
  ];
  const users = await clerkClient.users.getUserList({ userId: userIds });
  const userMap = new Map(
    users.data.map((user) => [user.id, `${user.firstName} ${user.lastName}`]),
  );

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
    recentActivity: recentActivity.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      userFullName: userMap.get(activity.userId) || "Usuário Desconhecido",
      createdAt: activity.createdAt,
    })),
  };
}
