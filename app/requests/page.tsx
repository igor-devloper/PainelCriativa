import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/app/_lib/utils";
import { getRequests } from "@/app/_actions/get-requests";
import { RequestsPageWrapper } from "@/app/_components/requests-page-wrapper";

export const metadata = {
  title: "Solicitações - Painel Criativa",
};

export default async function RequestsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);
  const requests = await getRequests(userRole, userId);
  const users = await clerkClient.users.getUserList();

  const formattedUsers = users.data.map((user) => ({
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    imageUrl: user.imageUrl,
  }));

  return (
    <RequestsPageWrapper
      userRole={userRole}
      requests={requests}
      users={formattedUsers}
      userId={userId}
    />
  );
}
