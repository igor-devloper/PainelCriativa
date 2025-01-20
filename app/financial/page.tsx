import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/app/_lib/utils";
import { clerkClient } from "@clerk/nextjs/server";
import { getPendingRequestsCount } from "@/app/_actions/get-pending-requests-count";
import { getFinancialOverviewData } from "@/app/_actions/financial-actions";
import { AppSidebar } from "@/app/_components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/_components/ui/scroll-area";
import { DollarSign } from "lucide-react";
import { FinancialOverview } from "@/app/_components/financial-overview";

export const metadata = {
  title: "Área Financeira - Criativa",
};

export default async function FinancialPage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);
  const pendingRequestsCount = await getPendingRequestsCount();

  if (userRole !== "ADMIN" && userRole !== "FINANCE") {
    redirect("/");
  }

  const financialData = await getFinancialOverviewData();

  // Add default data if no data is returned
  if (!financialData.approvedValues.length) {
    financialData.approvedValues = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString("pt-BR", { month: "short" }),
        value: 0,
      };
    }).reverse();
  }

  if (!financialData.expensesByCategory.length) {
    financialData.expensesByCategory = [{ category: "Sem dados", value: 0 }];
  }

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
        <div className="flex w-[350px] flex-col space-y-6 overflow-hidden p-6 pb-10 pr-10 md:w-full">
          <div className="flex justify-between">
            <div className="flex h-16 items-center gap-4 px-4">
              <DollarSign className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Área Financeira</h1>
            </div>
          </div>
          <ScrollArea className="h-full">
            <FinancialOverview data={financialData} />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
