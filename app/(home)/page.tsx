import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";
import { isMatch } from "date-fns";
import TransactionsPieChart from "./_components/transactions-pie-chart";
import { getDashboard } from "../_data/get-dashboard";
import ExpensesPerCategory from "./_components/expenses-per-category";
import LastTransactions from "./_components/last-transactions";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import AiReportButton from "./_components/ai-report-button";
import { ScrollArea } from "../_components/ui/scroll-area";

interface HomeProps {
  searchParams: {
    month: string;
  };
}

const Home = async ({ searchParams: { month } }: HomeProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const monthIsInvalid = !month || !isMatch(month, "MM");
  if (monthIsInvalid) {
    redirect(`?month=${new Date().getMonth() + 1}`);
  }
  const dashboard = await getDashboard(month);
  const userCanAddTransaction = await canUserAddTransaction();
  const user = await clerkClient().users.getUser(userId);
  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        <div className="flex flex-col items-center justify-center gap-4 md:flex md:items-center md:justify-between md:gap-4">
          <h1 className="text-lg font-bold md:text-2xl">Dashboard</h1>
          <div className="flex items-center gap-2">
            <AiReportButton
              month={month}
              hasPremiumPlan={
                user.publicMetadata.subscriptionPlan === "premium"
              }
            />
            <TimeSelect />
          </div>
        </div>
        <>
          <div className="hidden md:grid md:h-full md:grid-cols-[2fr,1fr] md:gap-6 md:overflow-hidden">
            <div className="flex flex-col gap-6 overflow-hidden">
              <SummaryCards
                month={month}
                {...dashboard}
                userCanAddTransaction={userCanAddTransaction}
              />
              <div className="grid h-full grid-cols-3 grid-rows-1 gap-6 overflow-hidden">
                <TransactionsPieChart {...dashboard} />
                <ExpensesPerCategory
                  expensesPerCategory={dashboard.totalExpensePerCategory}
                />
              </div>
            </div>
            <LastTransactions lastTransactions={dashboard.lastTransactions} />
          </div>
          <ScrollArea>
            <div className="h-ful flex flex-col gap-10 md:hidden">
              <div className="flex flex-col gap-10 overflow-hidden">
                <SummaryCards
                  month={month}
                  {...dashboard}
                  userCanAddTransaction={userCanAddTransaction}
                />
                <div className="flex flex-col gap-10 overflow-hidden">
                  <TransactionsPieChart {...dashboard} />
                  <ExpensesPerCategory
                    expensesPerCategory={dashboard.totalExpensePerCategory}
                  />
                </div>
              </div>
              <LastTransactions lastTransactions={dashboard.lastTransactions} />
            </div>
          </ScrollArea>
        </>
      </div>
    </>
  );
};

export default Home;
