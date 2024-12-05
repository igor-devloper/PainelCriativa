/* eslint-disable @typescript-eslint/no-unused-vars */
import { Home, HandCoins, Settings, Users, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/app/_components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { getUserTeams } from "@/app/_actions/get-user-team";
import { ClientSidebarContent } from "./client-sidebar-content";

const defaultNavItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Times",
    url: "/teams",
    icon: Users,
  },
  {
    title: "Transações",
    url: "/transactions",
    icon: HandCoins,
  },
];

const adminNavItem = {
  title: "Administrador",
  url: "/admin",
  icon: Settings,
};

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const userTeams = await getUserTeams();

  const isAdmin = false; // Você precisará implementar a lógica para verificar se o usuário é admin

  const navItems = isAdmin
    ? [...defaultNavItems, adminNavItem]
    : defaultNavItems;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="bg-white p-4">
              <Link href="/" className="flex items-center justify-center">
                <div className="text-sm leading-tight">
                  <Image
                    src="/logo.png"
                    width={100}
                    height={10}
                    alt="NE"
                    className="p-4"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <ClientSidebarContent navItems={navItems} userTeams={userTeams} />
      <SidebarFooter className="mb-4 flex items-center justify-center text-xl text-gray-700">
        <UserButton showName />
      </SidebarFooter>
    </Sidebar>
  );
}
