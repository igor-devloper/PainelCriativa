import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { UserRole } from "@/app/types";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";

interface DashboardOverviewProps {
  userRole: UserRole;
  pendingRequestsCount: number;
}

export function DashboardOverview({
  userRole,
  pendingRequestsCount,
}: DashboardOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Solicitações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{pendingRequestsCount}</p>
          <Link href="/requests">
            <Button className="mt-4">Ver Solicitações</Button>
          </Link>
        </CardContent>
      </Card>

      {(userRole === "ADMIN" || userRole === "FINANCE") && (
        <Card>
          <CardHeader>
            <CardTitle>Prestações de Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/accounting">
              <Button>Gerenciar Prestações</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      {userRole === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Administração</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button>Painel de Administração</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
