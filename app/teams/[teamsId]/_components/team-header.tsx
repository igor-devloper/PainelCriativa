import { Team } from "@prisma/client";

interface TeamHeaderProps {
  team: Team;
}

export function TeamHeader({ team }: TeamHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{team.name}</h1>
      <p className="text-muted-foreground">ID da Equipe: {team.id}</p>
    </div>
  );
}
