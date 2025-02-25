"use client";
import { HomeIcon } from "lucide-react";
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
import { Button } from "@/app/_components/ui/button";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { Avatar } from "./_components/ui/avatar";
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
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <HomeIcon className="h-6 w-6" />
              <Skeleton className="h-8 w-[400px]" />
            </div>
            <Button disabled variant="default" className="gap-2">
              <Skeleton className="h-4 w-[120px]" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Seus Saldos */}
            <Card>
              <CardHeader>
                <CardTitle>Seus Saldos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Blocos Contábeis Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Blocos Contábeis Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>Código</div>
                    <div>Empresa</div>
                    <div>Valor</div>
                    <div>Status</div>
                  </div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4">
                      <Skeleton className="h-4 w-[80px]" />
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-[80px]" />
                      <Skeleton className="h-5 w-[70px] rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[100px] rounded-lg" />
                <Skeleton className="h-[100px] rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
