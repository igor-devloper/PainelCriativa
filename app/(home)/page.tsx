import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClientHomeWrapper } from "@/app/_components/client-home-wrapper";
import { getDashboardOverview } from "@/app/_actions/get-dashboard-overview";
import { getUserRole } from "../_lib/utils";
import Loading from "../admin/loading";

export default async function HomePage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient.users.getUser(userId);
  const dashboardData = await getDashboardOverview();
  const userRole = getUserRole(user.publicMetadata);
  const users = await clerkClient.users.getUserList();

  const formattedUsers = users.data.map((user) => ({
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    imageUrl: user.imageUrl,
  }));

  return (
    <>
      <ClientHomeWrapper
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
        recentActivity={dashboardData.recentActivity}
      />
      <Loading />
    </>
  );
}
