/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClientHomeWrapper } from "@/app/_components/client-home-wrapper";
import { getDashboardOverview } from "@/app/_actions/get-dashboard-overview";
import { getUserRole } from "../_lib/utils";
import { getUserBalance } from "../_lib/actions/balance";
import { getAccountingBlocks } from "../_actions/get-accounting-blocks";
import { getClerkUser, getClerkUserList } from "../_lib/clerk-helpers"; // Novo arquivo com funções em cache

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  // Use as funções em cache
  const user = await getClerkUser(userId);
  const userRole = getUserRole(user.publicMetadata);

  // Execute chamadas paralelas para melhorar o desempenho
  const [dashboardData, users, balances, blocks] = await Promise.all([
    getDashboardOverview(),
    getClerkUserList(),
    getUserBalance(),
    getAccountingBlocks(),
  ]);

  const formattedUsers = users.data.map(
    (user: { id: any; firstName: any; lastName: any; imageUrl: any }) => ({
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl,
    }),
  );

  const formattedRecentActivity = dashboardData.recentActivity.map(
    (activity: { createdAt: string | number | Date }) => ({
      ...activity,
      createdAt: new Date(activity.createdAt),
    }),
  );

  return (
    <>
      <ClientHomeWrapper
        userBalances={balances as { [key: string]: number }}
        users={formattedUsers}
        userRole={userRole}
        userName={`${user.firstName} ${user.lastName}`}
        pendingRequestsCount={dashboardData.pendingRequests.count}
        activeUsersCount={dashboardData.activeUsers.count}
        activeUsersChange={dashboardData.activeUsers.percentageChange}
        accountStatementsCount={dashboardData.accountStatements.count}
        accountStatementsChange={
          dashboardData.accountStatements.percentageChange
        }
        recentActivity={formattedRecentActivity}
        blocks={blocks}
      />
    </>
  );
}
