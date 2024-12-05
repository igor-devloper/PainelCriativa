/* eslint-disable @typescript-eslint/no-explicit-any */
import { Home, HandCoins, Settings, Users } from "lucide-react";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/_components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userTeams: any[]; // Replace 'any' with the correct type for your teams
}

export function AppSidebar({ userTeams, ...props }: AppSidebarProps) {
  const isAdmin = false; // You'll need to implement the logic to check if the user is admin

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
      <SidebarFooter className="mb-4 flex items-center justify-center">
        <UserButton
          showName={true}
          afterSignOutUrl="/"
          userProfileMode="navigation"
          userProfileUrl="/user-profile"
          appearance={{
            elements: {
              userButtonBox: "flex items-center gap-2",
              userButtonOuterIdentifier: "text-black font-semibold",
              userButtonTrigger: "focus:shadow-none focus:outline-none",
            },
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
