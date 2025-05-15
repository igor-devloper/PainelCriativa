import { db } from "@/app/_lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { AdminStats } from "@/app/types";

export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Get total users from Clerk
    const users = await (await clerkClient()).users.getUserList();
    const totalUsers = users.data.length;

    // Get pending requests count
    const pendingRequests = await db.request.count({
      where: {
        status: "WAITING",
      },
    });

    // Calculate total approved amount
    const approvedRequests = await db.request.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    // Get count of open accounting blocks
    const openAccountingBlocks = await db.accountingBlock.count({
      where: {
        status: "OPEN",
      },
    });

    return {
      totalUsers,
      pendingRequests,
      totalApprovedAmount: approvedRequests._sum.amount?.toNumber() ?? 0,
      openAccountingBlocks,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    // Return default values in case of error
    return {
      totalUsers: 0,
      pendingRequests: 0,
      totalApprovedAmount: 0,
      openAccountingBlocks: 0,
    };
  }
}
