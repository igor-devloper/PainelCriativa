import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/app/_components/app-sidebar";
import { ClientHomeWrapper } from "@/app/_components/client-home-wrapper";
import { getUserTeams } from "@/app/_actions/get-user-teams";

export const metadata = {
  title: "Equipes - Painel Criativa",
};

export default async function Home() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const userTeams = await getUserTeams();

  return (
    <ClientHomeWrapper userTeams={userTeams}>
      <AppSidebar userTeams={userTeams} />
    </ClientHomeWrapper>
  );
}
