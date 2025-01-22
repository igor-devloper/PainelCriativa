/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import type { AdminStats, UserRole } from "@/app/types";
import { Button } from "@/app/_components/ui/button";
import { ClipboardList, Users, FileText } from "lucide-react";
import { CreateRequestButton } from "./create-request-button";
import Link from "next/link";

interface DashboardOverviewProps {
  userRole: UserRole;
  pendingRequestsCount: number;
  userName: string;
  userCount: number;
  stats: AdminStats;
}

export function DashboardOverview({
  userRole,
  pendingRequestsCount,
  userName,
  userCount,
  stats,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Bem-vindo, {userName}!
        </h2>
        <CreateRequestButton />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solicitações Pendentes
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequestsCount}</div>
          </CardContent>
        </Card>
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"></div>
            <p className="text-xs text-muted-foreground">+10% em relação ao mês passado</p>
          </CardContent>
        </Card> */}
        {userRole === "ADMIN" || userRole === "FINANCE" ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{userCount}</div>
              <p className="text-xs text-muted-foreground"></p>
            </CardContent>
          </Card>
        ) : (
          ""
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prestações de Contas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.openAccountingBlocks}
            </div>
            <p className="text-xs text-muted-foreground">
              -8% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <CreateRequestButton />
            <Link href="/requests">
              <Button className="flex w-full justify-start" variant="outline">
                <ClipboardList className="mr-2 h-4 w-4" />
                Ver Solicitações
              </Button>
            </Link>
            {(userRole === "ADMIN" || userRole === "FINANCE") && (
              <Link href="/accounting">
                <Button className="flex w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerenciar Prestações
                </Button>
              </Link>
            )}
            {userRole === "ADMIN" && (
              <Link href="/admin">
                <Button className="flex w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Painel de Administração
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
        {/* <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Você tem 3 solicitações não visualizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Nova solicitação criada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Há 2 horas por João Silva
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Prestação de contas aprovada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Há 5 horas por Maria Oliveira
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Novo usuário registrado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Há 1 dia por Carlos Ferreira
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
