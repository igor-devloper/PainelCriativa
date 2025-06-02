"use server";

import { db } from "@/app/_lib/prisma";
import { queryWithCache } from "@/app/_lib/db-utils";
import { auth } from "@clerk/nextjs/server";

export async function getDashboardOverview() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return queryWithCache(
    `dashboard-overview-${userId}`,
    async () => {
      const now = new Date();
      const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // 📌 Combine estatísticas simples em uma só função SQL
      const [
        pendingCountNow,
        pendingCountPrev,
        activeNow,
        activePrev,
        statementsNow,
        statementsPrev,
      ] = await Promise.all([
        db.request.count({
          where: {
            status: "WAITING",
            createdAt: { gte: startCurrentMonth },
          },
        }),
        db.request.count({
          where: {
            status: "WAITING",
            createdAt: { gte: startPrevMonth, lt: startCurrentMonth },
          },
        }),
        db.request.findMany({
          where: { createdAt: { gte: startCurrentMonth } },
          select: { userId: true },
          distinct: ["userId"],
        }),
        db.request.findMany({
          where: { createdAt: { gte: startPrevMonth, lt: startCurrentMonth } },
          select: { userId: true },
          distinct: ["userId"],
        }),
        db.accountingBlock.count({
          where: { createdAt: { gte: startCurrentMonth } },
        }),
        db.accountingBlock.count({
          where: { createdAt: { gte: startPrevMonth, lt: startCurrentMonth } },
        }),
      ]);

      // 🔢 Percentuais com segurança contra divisão por zero
      const percent = (cur: number, prev: number) =>
        prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

      // 🧠 Atividade recente simplificada

      return {
        pendingRequests: {
          count: pendingCountNow,
          percentageChange: percent(pendingCountNow, pendingCountPrev),
        },
        activeUsers: {
          count: activeNow.length,
          percentageChange: percent(activeNow.length, activePrev.length),
        },
        accountStatements: {
          count: statementsNow,
          percentageChange: percent(statementsNow, statementsPrev),
        },
      };
    },
    120,
  );
}
