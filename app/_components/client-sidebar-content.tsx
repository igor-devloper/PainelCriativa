"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/app/_components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface Team {
  id: string;
  name: string;
}

interface ClientSidebarContentProps {
  navItems: NavItem[];
  userTeams: Team[];
}

export function ClientSidebarContent({
  navItems,
  userTeams,
}: ClientSidebarContentProps) {
  const pathname = usePathname();
  const [isTeamsOpen, setIsTeamsOpen] = useState(true);

  return (
    <SidebarContent>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.title === "Times" ? (
              <>
                <SidebarMenuButton
                  onClick={() => setIsTeamsOpen(!isTeamsOpen)}
                  className="w-full justify-between"
                  isActive={pathname.startsWith(item.url)}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isTeamsOpen ? "rotate-180" : ""
                    }`}
                  />
                </SidebarMenuButton>
                {isTeamsOpen && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === "/teams"}
                      >
                        <Link href="/teams">Todos os Times</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === "/teams/new"}
                      >
                        <Link href="/teams/new">Criar Time</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    {userTeams.map((team) => (
                      <SidebarMenuSubItem key={team.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === `/teams/${team.id}`}
                        >
                          <Link href={`/teams/${team.id}`}>{team.name}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </>
            ) : (
              <SidebarMenuButton asChild isActive={pathname === item.url}>
                <Link href={item.url} className="flex items-center">
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarContent>
  );
}