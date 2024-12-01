import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { adminColumns } from "./_columns";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea, ScrollBar } from "../_components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../_components/ui/sidebar";
import { AppSidebar } from "../_components/app-sidebar";
import { Separator } from "../_components/ui/separator";
import { userAdmin } from "../_data/user-admin";
import { FileSliders } from "lucide-react";

const AdminPage = async () => {
  const { userId } = await auth();
  const usuarioAdm = await userAdmin();
  if (!userId) {
    redirect("/login");
  }
  if (!usuarioAdm) {
    redirect("/");
  }

  const transactions = await db.transaction.findMany({
    orderBy: {
      date: "desc",
    },
  });
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <>
            <div className="flex w-[500px] flex-col space-y-6 overflow-hidden p-6 pb-10 md:w-full">
              {/* TÍTULO E BOTÃO */}
              <div className="flex flex-col items-center gap-4 md:w-full md:flex-row md:justify-between">
                <div className="flex items-center justify-center gap-2">
                  <FileSliders />
                  <h1 className="text-2xl font-bold">Dashboard Admin</h1>
                </div>
              </div>
              <ScrollArea className="h-full">
                <DataTable
                  columns={adminColumns}
                  data={JSON.parse(JSON.stringify(transactions))}
                />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminPage;
