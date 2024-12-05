import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/app/_components/app-sidebar";
import { ClientHomeWrapper } from "../_components/client-home-wrapper";

export const metadata = {
  title: "Equipes - Painel Criativa",
};

export default async function Home() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  return (
    <ClientHomeWrapper>
      <AppSidebar />
    </ClientHomeWrapper>
  );
}
