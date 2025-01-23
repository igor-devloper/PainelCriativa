import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import type { UserRole } from "@/app/types";
import { ClipboardList, Users, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateRequestButton } from "./create-request-button";
import Link from "next/link";
import { Button } from "./ui/button";

interface DashboardOverviewProps {
  userRole: UserRole;
  userName: string;
  pendingRequestsCount: number;
  activeUsersCount: number;
  activeUsersChange: number;
  accountStatementsCount: number;
  accountStatementsChange: number;
  recentActivity: {
    id: string;
    type: "REQUEST_CREATED" | "STATEMENT_APPROVED" | "USER_REGISTERED";
    description: string;
    userFullName: string;
    createdAt: Date;
  }[];
}

export function DashboardOverview({
  userName,
  pendingRequestsCount,
  activeUsersCount,
  activeUsersChange,
  accountStatementsCount,
  accountStatementsChange,
  recentActivity,
  userRole,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Bem-vindo, {userName}!
        </h2>
        <CreateRequestButton />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{activeUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsersChange > 0 ? "+" : ""}
              {activeUsersChange.toFixed(0)}% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prestações de Contas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountStatementsCount}</div>
            <p className="text-xs text-muted-foreground">
              {accountStatementsChange > 0 ? "+" : ""}
              {accountStatementsChange.toFixed(0)}% em relação ao mês passado
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
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas atualizações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.type === "REQUEST_CREATED" &&
                        "Nova solicitação criada"}
                      {activity.type === "STATEMENT_APPROVED" &&
                        "Prestação de contas aprovada"}
                      {activity.type === "USER_REGISTERED" &&
                        "Novo usuário registrado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(activity.createdAt, {
                        addSuffix: true,
                        locale: ptBR,
                      })}{" "}
                      por {activity.userFullName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
