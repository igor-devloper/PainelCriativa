/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { acceptInvitation } from "@/app/_actions/invite-member";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { getUserTeams } from "@/app/_actions/get-user-team";
import { userAdmin } from "@/app/_data/user-admin";

export default async function AcceptInvitationPage({
  params,
}: {
  params: { token: string };
}) {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const userTeams = await getUserTeams();
  const isAdmin = await userAdmin();

  async function handleAcceptInvitation() {
    "use server";
    const result = await acceptInvitation(params.token);
    if (result.success && result.teamId) {
      redirect(`/teams/${result.teamId}`);
    } else {
      // Trate o erro adequadamente
      console.error(result.message);
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar userTeams={userTeams} isAdmin={isAdmin ?? false} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="container mx-auto flex min-h-screen items-center justify-center">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Convite para Equipe</CardTitle>
              <CardDescription>
                Você foi convidado para se juntar a uma equipe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Clique no botão abaixo para aceitar o convite e se juntar à
                equipe.
              </p>
            </CardContent>
            <CardFooter>
              <form action={handleAcceptInvitation}>
                <Button type="submit">Aceitar Convite</Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
