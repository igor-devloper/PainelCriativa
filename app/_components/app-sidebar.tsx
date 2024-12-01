"use client";

import { Home, Sparkles, HandCoins, Settings } from "lucide-react";
import { NavMain } from "@/app/_components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/_components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation"; // Importando o hook para obter o pathname atual

const defaultNavItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Transações",
    url: "/transactions",
    icon: HandCoins,
  },
  {
    title: "Ask AI",
    url: "#",
    icon: Sparkles,
  },
];

const adminNavItem = {
  title: "Administrador",
  url: "/admin",
  icon: Settings,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const pathname = usePathname(); // Obtendo o pathname atual

  const isAdmin = user?.publicMetadata?.role === "admin";

  const navItems = isAdmin
    ? [...defaultNavItems, adminNavItem]
    : defaultNavItems;

  // Atualizar a propriedade isActive com base no pathname atual
  const navItemsWithActive = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }));

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
      <SidebarContent>
        <NavMain items={navItemsWithActive} />
      </SidebarContent>
      <SidebarFooter className="mb-4 flex items-center justify-center text-xl text-gray-700">
        <UserButton showName />
      </SidebarFooter>
    </Sidebar>
  );
}
