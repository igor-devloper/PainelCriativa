"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { UserRole, AccountingBlock } from "@/app/types";
import { AccountingBlocksTable } from "./accounting-blocks-table";
import { HandCoins } from "lucide-react";
import { UserBalance } from "./user-balance";
import { Decimal } from "@prisma/client/runtime/library";

interface AccountingPageWrapperProps {
  userRole: UserRole;
  accountingBlocks: AccountingBlock[];
  userBalance: number | Decimal;
}

export function AccountingPageWrapper({
  userRole,
  accountingBlocks,
  userBalance,
}: AccountingPageWrapperProps) {
  const pendingRequestsCount = 0; // This should be fetched or passed as a prop

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

        <ScrollArea className="max-h-[600px]">
          <div className="flex w-[350px] flex-col overflow-hidden p-6 pb-10 pr-10 md:w-full">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-4">
                <HandCoins className="h-6 w-6" />
                <h1 className="text-xl font-semibold">
                  {userRole === "USER" ? <h1>Suas</h1> : ""}
                  Prestações de Contas
                </h1>
              </div>
              <UserBalance balance={userBalance} />
            </div>
            <ScrollArea className="h-full flex-1">
              <div className="container mx-auto py-6">
                <AccountingBlocksTable blocks={accountingBlocks} />
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
