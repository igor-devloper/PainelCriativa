"use client";
export const revalidate = 0;
export const dynamic = "force-dynamic";
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
    title: "Solicitações",
    url: "/requests",
    icon: Siren,
  },
  {
    title: "Prestações de Contas",
    url: "/accounting",
    icon: HandCoins,
  },
  {
    title: "Despesas",
    url: "/transactions",
    icon: Wallet,
  },
];

const financeNavItem = {
  title: "Financeiro",
  url: "/financial",
  icon: DollarSign,
};

const adminNavItem = {
  title: "Administrador",
  url: "/admin",
  icon: Settings,
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
  const navItems = (() => {
    switch (userRole) {
      case "ADMIN":
        return [...defaultNavItems, adminNavItem, financeNavItem];
      case "FINANCE":
        return [...defaultNavItems, financeNavItem];
      default:
        return defaultNavItems;
    }
  })();

  const updatedNavItems = navItems.map((item) =>
    item.title === "Solicitações"
      ? { ...item, badgeCount: pendingRequestsCount }
      : item,
  );

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
      <ClientSidebarContent navItems={updatedNavItems} />
      <SidebarFooter className="mb-4 flex items-center justify-center">
        <UserButton
          showName={true}
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
