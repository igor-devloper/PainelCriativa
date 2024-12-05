/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { StyleBread } from "@/app/_components/stily-bread";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { CreateTeamButton } from "@/app/_components/create-team-button";
import { TeamList } from "@/app/_components/team-list";

interface ClientHomeWrapperProps {
  children: React.ReactNode;
  userTeams: any[]; // Replace 'any' with the correct type for your teams
}

export function ClientHomeWrapper({
  children,
  userTeams,
}: ClientHomeWrapperProps) {
  return (
    <SidebarProvider>
      {children}
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <StyleBread />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4">
          <ScrollArea className="mb-20 max-h-[700px]">
            <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
              <div className="flex flex-col items-center justify-center gap-4 md:flex md:flex-row md:items-center md:justify-between md:gap-4">
                <h1 className="text-lg font-bold md:text-2xl">Suas Equipes</h1>
                <div className="flex items-center gap-2">
                  <CreateTeamButton />
                </div>
              </div>
              <TeamList userTeams={userTeams} />
            </div>
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
