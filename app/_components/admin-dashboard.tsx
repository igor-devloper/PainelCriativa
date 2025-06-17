import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { formatCurrency } from "@/app/_lib/utils";
import { AdminStats } from "../types";

interface AdminDashboardProps {
  stats: AdminStats;
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Solicitações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.pendingRequests}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Valor Total Aprovado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatCurrency(stats.totalApprovedAmount)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Blocos Contábeis Abertos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.openAccountingBlocks}</p>
        </CardContent>
      </Card>
    </div>
  );
}
