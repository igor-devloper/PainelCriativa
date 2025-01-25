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
import { toast } from "@/app/_hooks/use-toast";
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
import { formatExpenseCategory } from "@/app/_lib/utils";

export function ExpenseAnalysisCard() {
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const handleViewReport = async () => {
    try {
      setLoading(true);
      const data = await getExpenseAnalytics();
      setAnalytics(data);
      toast({
        title: "Sucesso",
        description: `Relatório despesas gerado com sucesso`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao carregar relatóeo de despesas: ${error}`,
      });
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
      toast({
        title: "Sucesso",
        description: `Análise de tendências gerado com sucesso`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao carregar tendências`,
      });
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
                    <XAxis
                      dataKey="category"
                      tickFormatter={(value) => formatExpenseCategory(value)}
                    />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Valor
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    R$ {data.value?.toLocaleString("pt-BR")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
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
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Valor
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      R$ {data.value?.toLocaleString("pt-BR")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
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
