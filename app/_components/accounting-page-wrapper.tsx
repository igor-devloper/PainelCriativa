"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import type { UserRole, AccountingBlock } from "@/app/types";
import { AccountingBlocksTable } from "./accounting-blocks-table";
import { UserBalance } from "./user-balance";
import { HandCoins } from "lucide-react";

interface AccountingPageWrapperProps {
  userRole: UserRole;
  accountingBlocks: AccountingBlock[];
  userBalances: { [key: string]: number };
  name: string;
}

export function AccountingPageWrapper({
  userRole,
  accountingBlocks,
  userBalances,
  name,
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
        <div className="flex w-[400px] flex-col overflow-hidden p-6 pb-10 pr-10 md:w-full">
          <div className="flex justify-between">
            <div className="flex justify-between">
              <div className="flex h-16 items-center gap-4 px-4">
                <HandCoins className="h-6 w-6" />
                <h1 className="text-xl font-semibold">Prestação de Contas</h1>
              </div>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <div className="w-[400px]">
              <UserBalance balances={userBalances} />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="container mx-auto py-6">
              <AccountingBlocksTable
                blocks={accountingBlocks}
                name={name}
                userRole={userRole}
              />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
