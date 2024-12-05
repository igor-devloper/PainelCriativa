import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Users, ArrowRight, AlertCircle, Trash } from "lucide-react";
import { Button } from "./ui/button";
import { deleteTeam } from "../_actions/delete-team";

interface Team {
  id: string;
  name: string;
  _count?: {
    members: number;
  };
}

interface TeamListProps {
  userTeams: Team[];
}

export function TeamList({ userTeams }: TeamListProps) {
  const DeleteTeam = async (teamId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteTeam({
      teamId: teamId,
    });
  };
  if (!userTeams || userTeams.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold text-muted-foreground">
            <AlertCircle className="mr-2 h-5 w-5" />
            Nenhuma equipe encontrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você ainda não faz parte de nenhuma equipe. Crie uma nova equipe ou
            peça para ser convidado para uma equipe existente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {userTeams.map((team) => (
        <Link href={`/teams/${team.id}`} key={team.id} className="group">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
              <Badge variant="secondary" className="text-sm">
                {team._count?.members ?? 0}{" "}
                {(team._count?.members ?? 0) === 1 ? "membro" : "membros"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users size={16} />
                <span>Equipe ativa</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Ver detalhes</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
                <Button
                  className="flex w-10 items-center"
                  variant="ghost"
                  onClick={(e) => DeleteTeam(team.id, e)}
                >
                  <Trash size={16} className="text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
