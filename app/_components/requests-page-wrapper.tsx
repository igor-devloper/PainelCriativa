/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import type { UserRole, Request } from "@/app/_actions/types";
import { RequestsList } from "./requests-list";
import { Siren } from "lucide-react";
import { TableSkeleton } from "@/app/_components/ui/table-skeleton";
import { Separator } from "@/app/_components/ui/separator";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "./ui/avatar";
import { UserButton } from "@clerk/nextjs";

interface RequestsPageWrapperProps {
  userRole: UserRole;
  requests: Request[];
  users: any[]; // TODO: Type this properly
  userId: string;
}

export function RequestsPageWrapper({
  userRole,
  requests,
  users,
  userId,
}: RequestsPageWrapperProps) {
  const pendingRequestsCount = requests.filter(
    (request) => request.status === "WAITING",
  ).length;

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole}
        pendingRequestsCount={pendingRequestsCount}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Avatar>
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: "flex items-center gap-2",
                    userButtonOuterIdentifier: "text-black font-semibold",
                    userButtonTrigger: "focus:shadow-none focus:outline-none",
                  },
                }}
              />
            </Avatar>
          </div>
        </header>
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
