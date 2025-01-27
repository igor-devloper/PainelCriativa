/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAdminDashboardData } from "@/app/_actions/get-admin-dashboard-data";
import type { AdminDashboardData, UserRole } from "@/app/types/dashboard";
import { AdminDashboard } from "./_components/admin-dashboard";
import { getDashboardOverview } from "../_actions/get-dashboard-overview";
import { getUserRole } from "../_lib/utils";
import { getFinancialDashboardData } from "../_actions/get-financial-dashboard-data";

export const metadata = {
  title: "Painel Administrativo - Painel Criativa",
  description:
    "Gerencie usuários, visualize métricas e analise dados do sistema",
};

export default async function AdminPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  try {
    // Get user data from Clerk
    const user = await clerkClient.users.getUser(userId);
    const userRole = getUserRole(user.publicMetadata);

    // Only allow ADMIN and FINANCE roles to access this page
    if (userRole !== "ADMIN" && userRole !== "FINANCE") {
      redirect("/dashboard");
    }

    // Fetch dashboard data in parallel
    const [dashboardData, dashboardOverview, expensesByCategory] =
      await Promise.all([
        getAdminDashboardData() as Promise<AdminDashboardData>,
        getDashboardOverview(),
        getFinancialDashboardData(),
      ]);

    return (
      <AdminDashboard
        expensesByCategory={expensesByCategory.expensesByCategory}
        data={dashboardData}
        pendingRequestsCount={dashboardOverview.pendingRequests.count}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error("Error in AdminPage:", error);
    throw new Error("Falha ao carregar dados do painel administrativo");
  }
}
