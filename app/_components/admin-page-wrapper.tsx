"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { UserRole, AdminStats } from "@/app/types";
import { AdminDashboard } from "./admin-dashboard";

interface AdminPageWrapperProps {
  userRole: UserRole;
  adminStats: AdminStats;
}

export function AdminPageWrapper({
  userRole,
  adminStats,
}: AdminPageWrapperProps) {
  const pendingRequestsCount = adminStats.pendingRequests;

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole}
        pendingRequestsCount={pendingRequestsCount}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-2xl font-bold">Painel de Administração</h1>
          </div>
        </header>
        <ScrollArea className="flex-1">
          <div className="container mx-auto py-6">
            <AdminDashboard stats={adminStats} />
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
