export const revalidate = 0;

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClientHomeWrapper } from "@/app/_components/client-home-wrapper";
import { getUserTeams } from "@/app/_actions/get-user-team";
import { userAdmin } from "@/app/_data/user-admin";

export default async function Home() {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const [userTeams, isAdmin] = await Promise.all([getUserTeams(), userAdmin()]);

  return <ClientHomeWrapper userTeams={userTeams} isAdmin={isAdmin ?? false} />;
}
