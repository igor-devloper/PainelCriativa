/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/app/_components/ui/sidebar";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import type { UserRole, Request } from "@/app/types";
import { RequestsList } from "./requests-list";
import { Siren } from "lucide-react";
import { TableSkeleton } from "@/app/_components/ui/table-skeleton";

interface RequestsPageWrapperProps {
  userRole: UserRole;
  requests: Request[];
  users: any[]; // TODO: Type this correctly
  userId: string;
}

// ... (rest of the imports remain the same)

export function RequestsPageWrapper({
  userRole,
  requests,
  users,
  userId,
}: RequestsPageWrapperProps) {
  const pendingRequestsCount = requests.filter(
    (r) => r.status === "WAITING",
  ).length;

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole}
        pendingRequestsCount={pendingRequestsCount}
      />
      <SidebarInset>
        {/* ... (header remains the same) ... */}
        <ScrollArea>
          <div className="flex w-[400px] flex-col overflow-hidden p-6 pb-10 pr-10 md:w-full">
            <div className="flex justify-between">
              <div className="flex h-16 items-center gap-4 px-4">
                <Siren className="h-6 w-6" />
                {userRole === "USER" ? (
                  <h1 className="text-xl font-semibold">Suas Solicitações</h1>
                ) : (
                  <h1 className="text-xl font-semibold">Solicitações</h1>
                )}
              </div>
            </div>
            <ScrollArea className="h-full flex-1">
              <div className="container mx-auto py-6">
                <Suspense fallback={<TableSkeleton columns={9} rows={5} />}>
                  <RequestsList
                    requests={requests}
                    userRole={userRole}
                    users={users}
                    userId={userId}
                  />
                </Suspense>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
