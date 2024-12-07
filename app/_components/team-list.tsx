"use client";

export const revalidate = 0;
export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import {
  Users,
  AlertCircle,
  Trash,
  MoreVertical,
  Pencil,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { deleteTeam } from "../_actions/delete-team";
import { toast } from "../_hooks/use-toast";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { revalidateTeam } from "../_actions/revalidate-team";

interface Team {
  id: string;
  name: string;
  _count?: {
    members: number;
  };
}

interface TeamListProps {
  userTeams?: Team[];
}

export function TeamList({ userTeams = [] }: TeamListProps) {
  const [deletingTeams, setDeletingTeams] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleTeamClick = async (teamId: string) => {
    await revalidateTeam(teamId);
    router.push(`/teams/${teamId}`);
    router.refresh();
  };

  const handleDeleteTeam = async (teamId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDeletingTeams((prev) => new Set(prev).add(teamId));

    try {
      await deleteTeam({
        teamId: teamId,
      });

      toast({
        title: "Time deletado",
        description: "A equipe foi excluída com sucesso.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setDeletingTeams((prev) => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });
    }
  };

  const handleEditTeam = (teamId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast({
      title: "Editar time",
      description: `Funcionalidade de edição para o time ${teamId} será implementada em breve.`,
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
        <Card
          key={team.id}
          className="transition-all duration-300 hover:shadow-lg"
        >
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
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="link"
                onClick={() => handleTeamClick(team.id)}
                className="text-sm font-medium hover:underline"
              >
                Ver detalhes
              </Button>
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => handleEditTeam(team.id, e)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Editar nome</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteTeam(team.id, e)}
                      disabled={deletingTeams.has(team.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      {deletingTeams.has(team.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="mr-2 h-4 w-4" />
                      )}
                      <span>Deletar time</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
