export const revalidate = 0;
export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClientHomeWrapper } from "@/app/_components/client-home-wrapper";
import { getUserTeams } from "@/app/_actions/get-user-team";
import { userAdmin } from "@/app/_data/user-admin";
import { getInvitationCount } from "../_actions/get-invitation-count";

export const metadata = {
  title: "Home - Painel Criativa",
};

export default async function Home() {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const [userTeams, isAdmin, invitationCount] = await Promise.all([
    getUserTeams(),
    userAdmin(),
    getInvitationCount(),
  ]);

  return (
    <ClientHomeWrapper
      userTeams={userTeams}
      isAdmin={isAdmin ?? false}
      invitationCount={invitationCount}
    />
  );
}
