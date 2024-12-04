import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { getTeamById } from "@/app/_actions/get-team-by-id";
import { TeamHeader } from "./_components/team-header";
import { MemberList } from "./_components/member-list";
import { InviteMemberDialog } from "./_components/invite-member-dialog";
import { CreateBlockDialog } from "./_components/create-block-dialog";
import { BlockList } from "./_components/block-list";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Separator } from "@/app/_components/ui/separator";

export default async function TeamPage({
  params,
}: {
  params: { teamId: string };
}) {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const team = await getTeamById(params.teamId);
  if (!team) {
    notFound();
  }

  const isAdmin = team.adminId === userId;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="container mx-auto p-8">
          <TeamHeader team={team} />
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Membros da Equipe</h2>
                {isAdmin && <InviteMemberDialog teamId={team.id} />}
              </div>
              <MemberList teamId={team.id} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Prestações de Contas</h2>
                {isAdmin && <CreateBlockDialog teamId={team.id} />}
              </div>
              <BlockList teamId={team.id} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
