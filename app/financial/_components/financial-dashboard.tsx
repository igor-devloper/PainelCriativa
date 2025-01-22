"use client";

import { SummaryCards } from "./summary-cards";
import { ExpensesByCompany } from "./expenses-by-company";
import { CashFlowChart } from "./cash-flow-chart";
import { PendingRequests } from "./pending-requests";
import { RecentAccountingBlocks } from "./recent-accounting-blocks";
import { ExpensesByCategoryChart } from "./expenses-by-category-chart";
import type { FinancialDashboardData } from "@/app/_actions/get-financial-dashboard-data";

interface FinancialDashboardProps {
  data: FinancialDashboardData;
}

export function FinancialDashboard({ data }: FinancialDashboardProps) {
  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full">
          <SummaryCards
            totalRevenue={data.metrics.totalRevenue}
            totalExpenses={data.metrics.totalExpenses}
            netProfit={data.metrics.netProfit}
            pendingRequestsAmount={data.metrics.pendingRequestsAmount}
          />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <CashFlowChart cashFlowData={data.cashFlowData} />
        </div>
        <div>
          <ExpensesByCompany expenseData={data.expensesByCompany} />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <ExpensesByCategoryChart
            expensesByCategory={data.expensesByCategory}
          />
        </div>
        <div>
          <PendingRequests requests={data.pendingRequests} />
        </div>
        <div className="md:col-span-2">
          <RecentAccountingBlocks blocks={data.recentAccountingBlocks} />
        </div>
      </div>
    </div>
  );
}
