export const revalidate = 0;
import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { transactionColumns } from "./_columns";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea, ScrollBar } from "../_components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../_components/ui/sidebar";
import { AppSidebar } from "../_components/app-sidebar";
import { Separator } from "../_components/ui/separator";
import { HandCoins } from "lucide-react";
import { getUserTeams } from "../_actions/get-user-team";
import { userAdmin } from "../_data/user-admin";
import { getInvitationCount } from "../_actions/get-invitation-count";

export const metadata = {
  title: "Transações - Painel Criativa",
};

const TransactionsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const transactions = await db.transaction.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
  });
  const userTeams = await getUserTeams();
  const isAdmin = await userAdmin();
  const invitationCount = await getInvitationCount();
  return (
    <SidebarProvider>
      <AppSidebar
        userTeams={userTeams}
        isAdmin={isAdmin ?? false}
        invitationCount={invitationCount}
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
            <div className="flex w-[350px] flex-col space-y-6 overflow-hidden p-6 pb-10 pr-10 md:w-full">
              {/* TÍTULO E BOTÃO */}
              <div className="flex justify-between">
                <div className="flex h-16 items-center gap-4 px-4">
                  <HandCoins className="h-6 w-6" />
                  <h1 className="text-xl font-semibold">Suas Transações</h1>
                </div>
              </div>
              <ScrollArea className="h-full">
                <DataTable
                  columns={transactionColumns}
                  data={JSON.parse(JSON.stringify(transactions))}
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

export default TransactionsPage;

// ({ isAdmin: isAdmin ?? false })
