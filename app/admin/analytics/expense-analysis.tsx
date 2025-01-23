/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { DollarSign, TrendingUp } from "lucide-react";
import { getExpenseAnalytics } from "@/app/_actions/admin-analytics";
import type { ExpenseAnalytics } from "@/app/_actions/admin-analytics";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ExpenseAnalysisCard() {
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const handleViewReport = async () => {
    try {
      setLoading(true);
      const data = await getExpenseAnalytics();
      setAnalytics(data);
    } catch (error) {
      toast.error("Erro ao carregar análise de despesas");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrends = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      const data = await getExpenseAnalytics(startDate, endDate);
      setAnalytics(data);
    } catch (error) {
      toast.error("Erro ao carregar tendências");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Despesas</CardTitle>
        <CardDescription>Relatórios detalhados de despesas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleViewReport}
            disabled={loading}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Relatório de Despesas
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleViewTrends}
            disabled={loading}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Análise de Tendências
          </Button>

          {analytics && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="mb-4 font-semibold">Despesas por Categoria</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {analytics.trends.length > 0 && (
                <div>
                  <h3 className="mb-4 font-semibold">Tendências de Despesas</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
