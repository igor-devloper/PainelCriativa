import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClientHomeWrapper } from "@/app/_components/client-home-wrapper";
import { getDashboardOverview } from "@/app/_actions/get-dashboard-overview";
import { getUserRole } from "../_lib/utils";
import Loading from "../admin/loading";
import { getUserBalance } from "../_lib/actions/balance";
import { getFinancialOverviewData } from "../_actions/financial-actions";
import { getFinancialDashboardData } from "../_actions/get-financial-dashboard-data";

export default async function HomePage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient.users.getUser(userId);
  const dashboardData = await getDashboardOverview();
  const userRole = getUserRole(user.publicMetadata);
  const users = await clerkClient.users.getUserList();
  const balances = await getUserBalance();
  const financialData = await getFinancialOverviewData();
  const dashboardFinancialData = await getFinancialDashboardData();

  const formattedUsers = users.data.map((user) => ({
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    imageUrl: user.imageUrl,
  }));
  const formattedRecentActivity = dashboardData.recentActivity.map(
    (activity) => ({
      ...activity,
      createdAt: new Date(activity.createdAt), // Converte string para Date
    }),
  );

  // Add default data if no data is returned
  if (!financialData.approvedValues.length) {
    financialData.approvedValues = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString("pt-BR", { month: "short" }),
        value: 0,
      };
    }).reverse();
  }

  if (!financialData.expensesByCategory.length) {
    financialData.expensesByCategory = [{ category: "Sem dados", value: 0 }];
  }
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
        blocks={dashboardFinancialData.recentAccountingBlocks}
      />
      <Loading />
    </>
  );
}
