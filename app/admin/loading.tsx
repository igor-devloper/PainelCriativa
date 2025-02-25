"use client";
import { BarChart } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/_components/ui/sidebar";
import { Separator } from "@/app/_components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
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
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          <div className="flex items-center justify-between space-y-2">
            <div className="flex items-center gap-4">
              <BarChart className="h-6 w-6" />
              <Skeleton className="h-8 w-[200px]" />
            </div>
            <Skeleton className="h-10 w-[150px]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Skeleton className="h-4 w-[100px]" />
                  </CardTitle>
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[100px]" />
                  <Skeleton className="mt-2 h-4 w-[150px]" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[350px] w-full" />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div className="flex items-center" key={i}>
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="ml-4 space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
