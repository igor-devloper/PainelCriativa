"use client";

import { Suspense } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { DashboardOverview } from "./dashboard-overview";
import { HomeIcon } from "lucide-react";
import { Avatar } from "@/app/_components/ui/avatar";
import { UserButton } from "@clerk/nextjs";
import { Separator } from "./ui/separator";
import { CardSkeleton } from "@/app/_components/ui/card-skeleton";
import { ThemeToggle } from "./theme-toggle";
import { UserRole } from "@/types";
import { AccountingBlock } from "../types";

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
  userBalances: { [key: string]: number };
  pendingRequestsCount: number;
  activeUsersCount: number;
  activeUsersChange: number;
  accountStatementsCount: number;
  accountStatementsChange: number;
  blocks: AccountingBlock[];
  // recentActivity: {
  //   id: string;
  //   type:
  //     | "REQUEST_CREATED"
  //     | "STATEMENT_APPROVED"
  //     | "USER_REGISTERED"
  //     | "EXPENSE_CREATED";
  //   description: string;
  //   userFullName: string;
  //   createdAt: Date;
  // }[];
}

export function ClientHomeWrapper({
  userName,
  pendingRequestsCount,
  blocks,
  userRole,
  users,
  activeUsersCount,
  activeUsersChange,
  accountStatementsCount,
  accountStatementsChange,
  userBalances,
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
        <div className="flex justify-between p-5">
          <div className="flex items-center gap-4">
            <HomeIcon className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Home</h1>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6">
            <Suspense fallback={<CardSkeleton />}>
              <DashboardOverview
                userBalances={userBalances}
                users={users}
                userRole={userRole}
                userName={userName}
                pendingRequestsCount={pendingRequestsCount}
                activeUsersCount={activeUsersCount}
                activeUsersChange={activeUsersChange}
                accountStatementsCount={accountStatementsCount}
                accountStatementsChange={accountStatementsChange}
                blocks={blocks}
              />
            </Suspense>
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
