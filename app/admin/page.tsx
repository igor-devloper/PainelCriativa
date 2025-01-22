import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/app/_components/admin-dashboard";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { LayoutDashboard, User2 } from "lucide-react";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "../_lib/utils";
import { getPendingRequestsCount } from "../_actions/get-pending-requests-count";
import { getAdminStats } from "../_actions/get-admin-stats";
import { ScrollArea, ScrollBar } from "../_components/ui/scroll-area";
import Link from "next/link";
import { Button } from "../_components/ui/button";

export const metadata = {
  title: "Painel Administrativo - Criativa",
};

export default async function AdminPage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const stats = await getAdminStats();
  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);
  const pendingRequestsCount = await getPendingRequestsCount();

  return (
    <SidebarProvider>
      <AppSidebar
        pendingRequestsCount={pendingRequestsCount}
        userRole={userRole}
      />
      <SidebarInset className="md:w-full">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="overflow-hiden w-[400px] space-y-6 p-6 pb-10 pr-10 md:w-full">
          <div className="flex flex-col justify-between md:flex-row">
            <div className="flex h-16 items-center gap-4 px-4">
              <LayoutDashboard className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Painel Administrativo</h1>
            </div>
            <div>
              <Link href="/admin/users">
                <Button className="flex items-center justify-center gap-2">
                  <User2 className="h-6 w-6" />
                  Gerenciar Cargos
                </Button>
              </Link>
            </div>
          </div>
          <ScrollArea className="h-full">
            <AdminDashboard stats={stats} />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
