import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/app/_lib/utils";
import { UserRoleManager } from "@/app/_components/user-role-manager";
import type { User } from "@clerk/nextjs/server";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { getPendingRequestsCount } from "@/app/_actions/get-pending-requests-count";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import { User2 } from "lucide-react";

export const metadata = {
  title: "Gerenciar Usuários - Painel Criativa",
};

export default async function ManageUsersPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);
  const pendingRequestsCount = await getPendingRequestsCount();

  if (userRole !== "ADMIN") {
    redirect("/");
  }

  const userList = await clerkClient.users.getUserList();
  const formattedUsers = userList.data.map((user: User) => ({
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Sem nome",
    role: getUserRole(user.publicMetadata),
  }));

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole}
        pendingRequestsCount={pendingRequestsCount}
      />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
          </header>

          <div className="flex w-[350px] flex-col space-y-6 overflow-hidden p-6 pb-10 pr-10 md:w-full">
            <div className="flex justify-between">
              <div className="flex h-16 items-center gap-4 px-4">
                <User2 className="h-6 w-6" />
                <h1 className="text-xl font-semibold">Gerenciar Usuarios</h1>
              </div>
            </div>
            <ScrollArea className="h-full">
              <UserRoleManager users={formattedUsers} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
