/* eslint-disable react-hooks/rules-of-hooks */
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isMatch } from "date-fns";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";
import TransactionsPieChart from "./_components/transactions-pie-chart";
import { getDashboard } from "@/app/_data/get-dashboard";
import ExpensesPerCategory from "./_components/expenses-per-category";
import LastTransactions from "./_components/last-transactions";
import { ScrollArea } from "../_components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../_components/ui/sidebar";
import { AppSidebar } from "../_components/app-sidebar";
import { Separator } from "../_components/ui/separator";
import { StyleBread } from "../_components/stily-bread";
import { LineChartIcon as ChartLine } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export const metadata = {
  title: "Dashboard - Painel Criativa",
};

interface HomeProps {
  searchParams: {
    month: string;
  };
}

const Home = async ({ searchParams: { month } }: HomeProps) => {
  const { userId } = await auth();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  if (!userId) {
    redirect("/login");
  }

  const isValidMonth = (month: string) => {
    return (
      month === "all" ||
      (isMatch(month, "MM") && parseInt(month) >= 1 && parseInt(month) <= 12)
    );
  };

  const monthIsInvalid = !month || !isValidMonth(month);
  if (monthIsInvalid) {
    redirect(`?month=${new Date().getMonth() + 1}`);
  }

  const dashboard = await getDashboard(month);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <StyleBread />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4">
          <ScrollArea className="mb-20 max-h-[700px]">
            <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
              <div className="flex flex-col items-center justify-center gap-4 md:flex md:flex-row md:items-center md:justify-between md:gap-4">
                <div className="flex items-center justify-center gap-2">
                  <ChartLine />
                  <h1 className="text-lg font-bold md:text-2xl">Dashboard</h1>
                </div>
                <div className="flex items-center gap-2">
                  <TimeSelect />
                </div>
              </div>
              <>
                <div className="hidden md:grid md:h-full md:grid-cols-[2fr,1fr] md:gap-6 md:overflow-hidden">
                  <div className="flex flex-col gap-6 overflow-hidden">
                    <SummaryCards
                      month={month}
                      {...dashboard}
                      refoundTotal={dashboard.refundTotal}
                      isAdmin={isAdmin}
                    />
                    <div className="grid h-full grid-cols-3 grid-rows-1 gap-6 overflow-hidden">
                      <TransactionsPieChart
                        {...dashboard}
                        refounTotal={dashboard.refundTotal}
                      />
                      <ExpensesPerCategory
                        expensesPerCategory={dashboard.totalExpensePerCategory}
                      />
                    </div>
                  </div>
                  <LastTransactions
                    isAdmin={isAdmin}
                    lastTransactions={dashboard.lastTransactions}
                  />
                </div>
                <ScrollArea>
                  <div className="h-ful flex flex-col gap-10 md:hidden">
                    <div className="flex flex-col gap-10 overflow-hidden">
                      <SummaryCards
                        month={month}
                        {...dashboard}
                        refoundTotal={dashboard.refundTotal}
                      />
                      <div className="flex flex-col gap-10 overflow-hidden">
                        <TransactionsPieChart
                          {...dashboard}
                          refounTotal={dashboard.refundTotal}
                        />
                        <ExpensesPerCategory
                          expensesPerCategory={
                            dashboard.totalExpensePerCategory
                          }
                        />
                      </div>
                    </div>
                    <LastTransactions
                      isAdmin={isAdmin ?? false}
                      lastTransactions={dashboard.lastTransactions}
                    />
                  </div>
                </ScrollArea>
              </>
            </div>
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Home;
