import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ClientHomeWrapper } from "@/app/_components/client-home-wrapper";
import { getUserTeams } from "@/app/_actions/get-user-team";
import { userAdmin } from "../_data/user-admin";

export const metadata = {
  title: "Equipes - Painel Criativa",
};

export default async function Home() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const userTeams = await getUserTeams();
  const isAdmin = await userAdmin();

  return <ClientHomeWrapper userTeams={userTeams} isAdmin={isAdmin ?? false} />;
}
