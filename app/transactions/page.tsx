export const revalidate = 0;

import { db } from "@/app/_lib/prisma";
import { DataTable } from "@/app/_components/ui/data-table";
import { expenseColumns } from "@/app/transactions/_columns";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { Receipt } from "lucide-react";
import { getUserRole } from "../_lib/utils";
import { getPendingRequestsCount } from "../_actions/get-pending-requests-count";

export const metadata = {
  title: "Despesas - Painel Criativa",
};

const ExpensesPage = async () => {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }
  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);
  const pendingRequestsCount = await getPendingRequestsCount();
  const where =
    userRole === "ADMIN" || userRole === "FINANCE" ? undefined : { userId };
  const expenses = await db.expense.findMany({
    where,
    orderBy: {
      date: "desc",
    },
    include: {
      block: {
        select: {
          code: true,
          request: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <SidebarProvider>
      <AppSidebar
        pendingRequestsCount={pendingRequestsCount}
        userRole={userRole}
      />
      <SidebarInset className="w-[100px] md:w-full">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ScrollArea className="max-h-[600px]">
            <div className="flex w-[400px] flex-col space-y-6 overflow-hidden p-6 pb-10 pr-10 md:w-full">
              <div className="flex justify-between">
                <div className="flex h-16 items-center gap-4 px-4">
                  <Receipt className="h-6 w-6" />
                  <h1 className="text-xl font-semibold">Suas Despesas</h1>
                </div>
              </div>
              <ScrollArea className="h-full">
                <DataTable
                  columns={expenseColumns}
                  data={JSON.parse(JSON.stringify(expenses))}
                />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ExpensesPage;
