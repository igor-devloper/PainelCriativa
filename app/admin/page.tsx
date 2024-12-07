import { getBlocks } from "@/app/_actions/get-blocks";
import { getUserTeams } from "../_actions/get-user-team";
import { userAdmin } from "../_data/user-admin";
import { getInvitationCount } from "../_actions/get-invitation-count";
import { AdminDashboardClient } from "@/app/admin/_components/admin-dashboard-client";

export default async function AdminDashboardPage() {
  // Fetch all initial data on the server
  const [blocks, userTeams, isAdminG, invitationCount] = await Promise.all([
    getBlocks(),
    getUserTeams(),
    userAdmin(),
    getInvitationCount(),
  ]);

  return (
    <AdminDashboardClient
      initialBlocks={blocks}
      initialUserTeams={userTeams}
      initialIsAdmin={isAdminG ?? false}
      initialInvitationCount={invitationCount}
    />
  );
}
