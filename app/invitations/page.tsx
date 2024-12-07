import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { getUserTeams } from "@/app/_actions/get-user-team";
import { userAdmin } from "@/app/_data/user-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { acceptInvitation } from "@/app/_actions/invite-member";
import { clerkClient } from "@clerk/nextjs/server";
import { getInvitationCount } from "../_actions/get-invitation-count";

async function getInvitations(userEmail: string) {
  return await db.teamInvitation.findMany({
    where: { email: userEmail },
    include: { team: true },
  });
}

export default async function InvitationsPage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient().users.getUser(userId);
  const userEmail = user.emailAddresses[0].emailAddress;
  const invitations = await getInvitations(userEmail);
  const userTeams = await getUserTeams();
  const isAdmin = await userAdmin();
  const invitationCount = await getInvitationCount();

  return (
    <SidebarProvider>
      <AppSidebar
        userTeams={userTeams}
        isAdmin={isAdmin ?? false}
        invitationCount={invitationCount}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="container mx-auto p-8">
          <h1 className="mb-6 text-3xl font-bold">Seus Convites</h1>
          {invitations.length === 0 ? (
            <p>Você não tem convites pendentes.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardHeader>
                    <CardTitle>{invitation.team.name}</CardTitle>
                    <CardDescription>
                      Convite para se juntar à equipe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      Expira em: {invitation.expiresAt.toLocaleDateString()}
                    </p>
                    <form
                      action={async () => {
                        "use server";
                        const result = await acceptInvitation(invitation.token);
                        if (result.success && result.teamId) {
                          redirect(`/teams/${result.teamId}`);
                        }
                      }}
                    >
                      <Button type="submit">Aceitar Convite</Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
