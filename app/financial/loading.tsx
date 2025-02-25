"use client";
import { LayoutDashboard } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { Avatar } from "../_components/ui/avatar";
import { UserButton } from "@clerk/nextjs";

export default function Loading() {
  return (
    <SidebarProvider>
      <AppSidebar userRole="USER" pendingRequestsCount={0} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Avatar>
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: "flex items-center gap-2",
                    userButtonOuterIdentifier: "text-black font-semibold",
                    userButtonTrigger: "focus:shadow-none focus:outline-none",
                  },
                }}
              />
            </Avatar>
          </div>
        </header>
        <div className="flex w-full flex-col p-4 pt-6 md:p-8">
          <div className="mb-6 flex items-center gap-4">
            <LayoutDashboard className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Top row of three cards */}
            <div className="col-span-full grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[120px]" />
                    <Skeleton className="mt-2 h-4 w-[180px]" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main chart card */}
            <div className="md:col-span-1 lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[200px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>

            {/* Side card */}
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[150px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
