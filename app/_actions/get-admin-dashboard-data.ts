/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export interface AdminDashboardData {
  metrics: {
    totalUsers: number;
    pendingRequests: number;
    totalApproved: number;
    openBlocks: number;
    userGrowth: number;
    totalExpenses: number;
  };
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: Date;
  }[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    user: string;
    date: Date;
  }[];
  expensesByCategory: {
    category: string;
    amount: number;
  }[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get all metrics
  const [
    pendingRequests,
    totalApproved,
    openBlocks,
    totalExpenses,
    expensesByCategory,
  ] = await Promise.all([
    db.request.count({
      where: { status: "WAITING" },
    }),
    db.request.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.accountingBlock.count({
      where: { status: "OPEN" },
    }),
    db.expense.aggregate({
      _sum: { amount: true },
    }),
    db.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
    }),
  ]);

  // Get users data from Clerk
  const usersList = await (
    await clerkClient()
  ).users.getUserList({
    limit: 100,
    orderBy: "-created_at",
  });

  const totalUsers = usersList.data.length;
  const lastMonthUsers = usersList.data.filter(
    (user: { createdAt: string | number | Date }) =>
      new Date(user.createdAt) >= startOfLastMonth &&
      new Date(user.createdAt) < startOfMonth,
  ).length;

  // Get recent users (last 5)
  const recentClerkUsers = usersList.data.slice(0, 5);

  // Get recent activity
  const recentRequests = await db.request.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      accountingBlock: true,
    },
  });

  const userGrowth =
    lastMonthUsers > 0
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100
      : 0;

  return {
    metrics: {
      totalUsers,
      pendingRequests,
      totalApproved: totalApproved._sum.amount?.toNumber() ?? 0,
      openBlocks,
      userGrowth,
      totalExpenses: totalExpenses._sum.amount?.toNumber() ?? 0,
    },
    recentUsers: recentClerkUsers.map(
      (user: {
        id: any;
        firstName: any;
        lastName: any;
        emailAddresses: { emailAddress: any }[];
        publicMetadata: { role: string };
        createdAt: string | number | Date;
      }) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        role: (user.publicMetadata.role as string) ?? "USER",
        joinedAt: new Date(user.createdAt),
      }),
    ),
    recentActivity: recentRequests.map((request) => ({
      id: request.id,
      type: request.accountingBlock ? "BLOCK_CREATED" : "REQUEST_CREATED",
      description: request.name,
      user: request.userId,
      date: request.createdAt,
    })),
    expensesByCategory: expensesByCategory.map((category) => ({
      category: category.category,
      amount: category._sum.amount?.toNumber() ?? 0,
    })),
  };
}
