export const revalidate = 0;
export const dynamic = "force-dynamic";
import { Team } from "@prisma/client";
import { Award } from "lucide-react";

interface TeamHeaderProps {
  team: Team;
}

export function TeamHeader({ team }: TeamHeaderProps) {
  return (
    <div className="flex h-16 items-center gap-4 px-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6" />
          <h1 className="text-xl font-semibold">{team.name}</h1>
        </div>
        <p className="text-base text-muted-foreground">
          Id da Equipe: {team.id}
        </p>
      </div>
    </div>
  );
}
