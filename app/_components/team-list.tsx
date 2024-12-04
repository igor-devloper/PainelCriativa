import { getUserTeams } from "@/app/_actions/get-user-team";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";

export async function TeamList() {
  const teams = await getUserTeams();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <Card key={team.id}>
          <CardHeader>
            <CardTitle>{team.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{team._count.members} membros</p>
            {/* Adicione mais informações da equipe conforme necessário */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
