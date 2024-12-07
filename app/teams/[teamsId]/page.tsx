export const revalidate = 0;

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getTeamById } from "@/app/_actions/get-team-by-id";
import { TeamHeader } from "../_components/team-header";
import { MemberList } from "../_components/member-list";
import { InviteMemberDialog } from "../_components/invite-member-dialog";
import { BlockList } from "../_components/block-list";
import { CreateBlockDialog } from "../_components/create-block-dialog";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { getUserTeams } from "@/app/_actions/get-user-team";
import { userAdmin } from "@/app/_data/user-admin";
import { Loader2 } from "lucide-react";
import { getInvitationCount } from "@/app/_actions/get-invitation-count";
import { ScrollArea } from "@/app/_components/ui/scroll-area";

interface PageProps {
  params: { teamId: string };
}

export async function generateMetadata({ params }: PageProps) {
  const team = await getTeamById(params.teamId);

  if (!team) {
    notFound();
  }

  return {
    title: `${team.name} - Painel Criativa`,
  };
}

async function TeamPageContent({ teamId }: { teamId: string }) {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const [team, userTeams, isAdminG, invitationCount] = await Promise.all([
    getTeamById(teamId),
    getUserTeams(),
    userAdmin(),
    getInvitationCount(),
  ]);

  if (!team) {
    notFound();
  }

  const isAdmin = team.adminId === userId;

  return (
    <SidebarProvider>
      <AppSidebar
        userTeams={userTeams}
        isAdmin={isAdminG ?? false}
        invitationCount={invitationCount}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <ScrollArea>
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
                  <h2 className="text-2xl font-bold">Blocos Financeiros</h2>
                  {isAdmin && <CreateBlockDialog teamId={team.id} />}
                </div>
                <BlockList teamId={team.id} isAdmin={isAdmin} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function TeamPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 size={50} className="animate-spin text-success" />
        </div>
      }
    >
      <TeamPageContent teamId={params.teamId} />
    </Suspense>
  );
}
