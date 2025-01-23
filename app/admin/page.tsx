/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAdminDashboardData } from "@/app/_actions/get-admin-dashboard-data";
import type { AdminDashboardData } from "@/app/_actions/get-admin-dashboard-data";
import { AdminDashboard } from "./_components/admin-dashboard";
import { getDashboardOverview } from "../_actions/get-dashboard-overview";
import { getUserRole } from "../_lib/utils";

export const metadata = {
  title: "Painel Administrativo - Painel Criativa",
};

interface AdminPageProps {
  data: AdminDashboardData;
}

export default async function AdminPage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const dashboardData = await getAdminDashboardData();
  const user = await clerkClient.users.getUser(userId);
  const pendingRequestsCount = (await getDashboardOverview()).pendingRequests
    .count;
  const userRole = getUserRole(user.publicMetadata);

  return (
    <AdminDashboard
      data={dashboardData}
      pendingRequestsCount={pendingRequestsCount}
      userRole={userRole}
    />
  );
}
