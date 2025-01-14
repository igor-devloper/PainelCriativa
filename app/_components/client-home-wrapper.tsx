"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { UserRole } from "@/app/types";
import { DashboardOverview } from "./dashboard-overview";
import { HomeIcon } from "lucide-react";
import { CreateTeamButton } from "./create-request-button";

interface ClientHomeWrapperProps {
  userRole: UserRole;
  pendingRequestsCount: number;
}

export function ClientHomeWrapper({
  userRole,
  pendingRequestsCount,
}: ClientHomeWrapperProps) {
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
          </div>
        </header>
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6">
            <div className="flex justify-between">
              <div className="flex h-16 w-full items-center justify-between gap-4 px-4">
                <div className="flex items-center justify-center gap-4">
                  <HomeIcon className="h-6 w-6" />
                  <h1 className="text-xl font-semibold">Home</h1>
                </div>
                <div className="mr-4">
                  <CreateTeamButton />
                </div>
              </div>
            </div>
            <DashboardOverview
              userRole={userRole}
              pendingRequestsCount={pendingRequestsCount}
            />
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
