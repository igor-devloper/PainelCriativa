"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import type { AdminStats, UserRole } from "@/app/types";
import { DashboardOverview } from "./dashboard-overview";
import { HomeIcon } from "lucide-react";
import { Avatar } from "@/app/_components/ui/avatar";
import UserInfo from "./user-info";

interface ClientHomeWrapperProps {
  userRole: UserRole;
  pendingRequestsCount: number;
  userName: string;
  userId: string;
  userCount: number;
  stats: AdminStats;
}

export function ClientHomeWrapper({
  userRole,
  pendingRequestsCount,
  userName,
  userCount,
  userId,
  stats,
}: ClientHomeWrapperProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole}
        pendingRequestsCount={pendingRequestsCount}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <UserInfo userId={userId} />
            </Avatar>
          </div>
        </header>
        <div className="flex justify-between p-5">
          <div className="flex items-center gap-4">
            <HomeIcon className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6">
            <DashboardOverview
              stats={stats}
              userCount={userCount}
              userRole={userRole}
              pendingRequestsCount={pendingRequestsCount}
              userName={userName}
            />
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
