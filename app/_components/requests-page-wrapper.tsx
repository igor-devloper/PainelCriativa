"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { UserRole, Request } from "@/app/types";
import { RequestsList } from "./requests-list";
import { Siren } from "lucide-react";

interface RequestsPageWrapperProps {
  userRole: UserRole;
  requests: Request[];
  user: string;
}

export function RequestsPageWrapper({
  userRole,
  requests,
  user,
}: RequestsPageWrapperProps) {
  const pendingRequestsCount = requests.filter(
    (r) => r.status === "DENIED",
  ).length;

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
        <div className="flex w-[350px] flex-col overflow-hidden p-6 pb-10 pr-10 md:w-full">
          <div className="flex justify-between">
            <div className="flex justify-between">
              <div className="flex h-16 items-center gap-4 px-4">
                <Siren className="h-6 w-6" />
                <h1 className="text-xl font-semibold">Solicitações</h1>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="container mx-auto py-6">
              <RequestsList
                requests={requests}
                userRole={userRole}
                user={user}
              />
            </div>
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
