export const revalidate = 0;
export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClientHomeWrapper } from "@/app/_components/client-home-wrapper";
import { getUserRole } from "@/app/_lib/utils";
import { getPendingRequestsCount } from "@/app/_actions/get-pending-requests-count";

export const metadata = {
  title: "Home - Painel Criativa",
};

export default async function Home() {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);
  const pendingRequestsCount = await getPendingRequestsCount();

  return (
    <ClientHomeWrapper
      userId={userId}
      userRole={userRole}
      pendingRequestsCount={pendingRequestsCount}
    />
  );
}
