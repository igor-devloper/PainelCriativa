"use client";

import type React from "react";
import {
  Home,
  HandCoins,
  Settings,
  Siren,
  Wallet,
  DollarSign,
} from "lucide-react";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/app/_components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { MenuBar } from "./menu-bar";
import { useTheme } from "next-themes";

const defaultNavItems = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Home",
    href: "/",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <Siren className="h-5 w-5" />,
    label: "Solicitações",
    href: "/requests",
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <HandCoins className="h-5 w-5" />,
    label: "Prestações de Contas",
    href: "/accounting",
    gradient:
      "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    label: "Despesas",
    href: "/transactions",
    gradient:
      "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
];

const financeNavItem = {
  icon: <DollarSign className="h-5 w-5" />,
  label: "Financeiro",
  href: "/financial",
  gradient:
    "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.06) 50%, rgba(91,33,182,0) 100%)",
  iconColor: "text-purple-500",
};

const adminNavItem = {
  icon: <Settings className="h-5 w-5" />,
  label: "Administrador",
  href: "/admin",
  gradient:
    "radial-gradient(circle, rgba(156,163,175,0.15) 0%, rgba(107,114,128,0.06) 50%, rgba(75,85,99,0) 100%)",
  iconColor: "text-gray-500",
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole: "ADMIN" | "FINANCE" | "USER";
  pendingRequestsCount: number;
}

export function AppSidebar({
  userRole,
  pendingRequestsCount,
  ...props
}: AppSidebarProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const navItems = (() => {
    switch (userRole) {
      case "ADMIN":
        return [...defaultNavItems, financeNavItem, adminNavItem];
      case "FINANCE":
        return [...defaultNavItems, financeNavItem];
      default:
        return defaultNavItems;
    }
  })();

  const updatedNavItems = navItems.map((item) =>
    item.label === "Solicitações"
      ? { ...item, badgeCount: pendingRequestsCount }
      : item,
  );

  return (
    <Sidebar
      variant="inset"
      className={`bg-sidebar ${isDarkTheme ? "text-sidebar-foreground" : "text-foreground"}`}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="">
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
            <p className="text-xs text-muted-foreground">Versão Beta</p>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <div className="flex-1 overflow-auto py-2">
        <MenuBar menuItems={updatedNavItems} />
      </div>
      <SidebarFooter className="mb-4 flex items-center justify-center">
        <UserButton
          showName={true}
          appearance={{
            elements: {
              userButtonBox: "flex items-center gap-2",
              userButtonOuterIdentifier: `${isDarkTheme ? "text-white" : "text-black"} font-semibold`,
              userButtonTrigger: "focus:shadow-none focus:outline-none",
            },
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
