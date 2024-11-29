import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { transactionColumns } from "./_columns";
import AddTransactionButton from "../_components/add-transaction-button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea } from "../_components/ui/scroll-area";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../_components/ui/sidebar";
import { AppSidebar } from "../_components/app-sidebar";
import { Separator } from "../_components/ui/separator";
import { HandCoins } from "lucide-react";

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
  const userCanAddTransaction = await canUserAddTransaction();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2 md:-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              <h1 className="text-lg font-semibold md:text-xl">Transações</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex flex-col space-y-4 md:space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <AddTransactionButton
                userCanAddTransaction={userCanAddTransaction}
              />
            </div>
            <ScrollArea className="h-[calc(100vh-13rem)] rounded-md border">
              <DataTable
                columns={transactionColumns}
                data={JSON.parse(JSON.stringify(transactions))}
              />
            </ScrollArea>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default TransactionsPage;
