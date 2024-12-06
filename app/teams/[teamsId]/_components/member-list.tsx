export const revalidate = 0;

import { getTeamMembers } from "@/app/_actions/get-team-members";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar";

export async function MemberList({ teamId }: { teamId: string }) {
  const members = await getTeamMembers(teamId);

  return (
    <div className="mt-4 space-y-4">
      {members.map((member) => (
        <div key={member.id} className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={member.profileImageUrl} />
            <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{member.name}</p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
