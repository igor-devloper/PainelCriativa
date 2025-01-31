"use client";

import { useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import {
  Users,
  ClipboardList,
  DollarSign,
  FileText,
  Activity,
  Shield,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { formatCurrency, formatExpenseCategory } from "@/app/_lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { Avatar } from "@/app/_components/ui/avatar";
import { UserButton } from "@clerk/nextjs";
import { NewUserDialog } from "@/app/_components/new-user-dialog";
import { UserTableRow } from "./user-table-row";
import type { AdminDashboardData, UserRole } from "@/app/types/dashboard";
import { CompanyMetricsCard } from "../analytics/company-metrics";
import { ExpenseAnalysisCard } from "../analytics/expense-analysis";
// import { ExportDataCard } from "../analytics/export-data";

interface AdminDashboardProps {
  data: AdminDashboardData;
  pendingRequestsCount: number;
  userRole: UserRole;
  expensesByCategory: {
    category: string;
    amount: number;
  }[];
}

export function AdminDashboard({
  data,
  pendingRequestsCount,
  userRole,
  expensesByCategory,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole}
        pendingRequestsCount={pendingRequestsCount}
      />
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: "flex items-center gap-2",
                    userButtonOuterIdentifier: "text-black font-semibold",
                    userButtonTrigger: "focus:shadow-none focus:outline-none",
                  },
                }}
              />
            </Avatar>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="container space-y-4 p-4 pt-6 md:p-8">
            <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
              <div className="flex items-center gap-4">
                <Shield className="h-5 w-5" />
                <h1 className="text-lg font-semibold">Painel administrativo</h1>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="analytics">Análises</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="space-y-4 p-1">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total de Usuários
                          </CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {data.metrics.totalUsers}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {data.metrics.userGrowth > 0 ? "+" : ""}
                            {data.metrics.userGrowth.toFixed(1)}% desde o último
                            mês
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Solicitações Pendentes
                          </CardTitle>
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {data.metrics.pendingRequests}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Aguardando aprovação
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Valor Total Aprovado
                          </CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(data.metrics.totalApproved)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Em solicitações aprovadas
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Blocos Contábeis Abertos
                          </CardTitle>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {data.metrics.openBlocks}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Aguardando fechamento
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                      <Card className="col-span-4">
                        <CardHeader>
                          <CardTitle>Despesas por Categoria</CardTitle>
                          <CardDescription>
                            Distribuição de despesas por categoria no último mês
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={expensesByCategory}>
                              <XAxis
                                dataKey="category"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) =>
                                  formatExpenseCategory(value)
                                }
                              />
                              <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0];
                                    return (
                                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="grid gap-2">
                                          <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                              {data.payload.category}
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                              {formatCurrency(
                                                data.value as number,
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar
                                dataKey="amount"
                                fill="currentColor"
                                radius={[4, 4, 0, 0]}
                                className="fill-primary"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card className="col-span-3">
                        <CardHeader>
                          <CardTitle>Atividade Recente</CardTitle>
                          <CardDescription>
                            Você tem {data.metrics.pendingRequests} solicitações
                            pendentes
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-8">
                            {data.recentActivity.map((activity) => (
                              <div
                                className="flex items-center"
                                key={activity.id}
                              >
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <div className="ml-4 space-y-1">
                                  <p className="text-sm font-medium leading-none">
                                    {activity.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(activity.date, "PPp", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="space-y-4 p-1">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Usuários do Sistema</CardTitle>
                          <CardDescription>
                            Gerencie os usuários e seus respectivos cargos
                          </CardDescription>
                        </div>
                        <NewUserDialog />
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Cargo</TableHead>
                              <TableHead>Data de Cadastro</TableHead>
                              <TableHead className="text-right">
                                Ações
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.recentUsers.map((user) => (
                              <UserTableRow key={user.id} user={user} />
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="grid gap-4 p-1 md:grid-cols-2 lg:grid-cols-3">
                    <CompanyMetricsCard />
                    <ExpenseAnalysisCard />
                    {/* <ExportDataCard /> */}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
