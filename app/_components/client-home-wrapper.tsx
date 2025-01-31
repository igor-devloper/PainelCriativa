/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { UserButton } from "@clerk/nextjs";
import { Separator } from "./ui/separator";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

interface ClientHomeWrapperProps {
  userRole: UserRole;
  userName: string;
  users: User[];
  pendingRequestsCount: number;
  activeUsersCount: number;
  activeUsersChange: number;
  accountStatementsCount: number;
  accountStatementsChange: number;
  recentActivity: {
    id: string;
    type:
      | "REQUEST_CREATED"
      | "STATEMENT_APPROVED"
      | "USER_REGISTERED"
      | "EXPENSE_CREATED";
    description: string;
    userFullName: string;
    createdAt: Date;
  }[];
}

export function ClientHomeWrapper({
  userName,
  pendingRequestsCount,
  userRole,
  users,
  activeUsersCount,
  activeUsersChange,
  accountStatementsCount,
  accountStatementsChange,
  recentActivity,
}: ClientHomeWrapperProps) {
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
        <div className="flex justify-between p-5">
          <div className="flex items-center gap-4">
            <HomeIcon className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Home</h1>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6">
            <DashboardOverview
              users={users}
              userRole={userRole}
              userName={userName}
              pendingRequestsCount={pendingRequestsCount}
              activeUsersCount={activeUsersCount}
              activeUsersChange={activeUsersChange}
              accountStatementsCount={accountStatementsCount}
              accountStatementsChange={activeUsersChange}
              recentActivity={recentActivity}
            />
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
