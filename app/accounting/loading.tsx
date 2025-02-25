"use client";

import { Suspense } from "react";
import { BarChart3 } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { CardSkeleton } from "@/app/_components/ui/card-skeleton";
import { TableSkeleton } from "@/app/_components/ui/table-skeleton";
import { ThemeToggle } from "@/app/_components/theme-toggle";

export default function Loading() {
  return (
    <SidebarProvider>
      <AppSidebar userRole="USER" pendingRequestsCount={0} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <ThemeToggle />
        </header>
        <div className="flex w-[400px] flex-col overflow-hidden p-6 pb-10 pr-10 md:w-full">
          <div className="flex justify-between">
            <div className="flex h-16 items-center gap-4 px-4">
              <BarChart3 className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Prestação de Contas</h1>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <div className="w-[400px]">
              <Suspense fallback={<CardSkeleton />}>
                <CardSkeleton />
              </Suspense>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="container mx-auto py-6">
              <Suspense
                fallback={<TableSkeleton columns={6} rows={3} showFooter />}
              >
                <TableSkeleton columns={6} rows={3} showFooter />
              </Suspense>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
