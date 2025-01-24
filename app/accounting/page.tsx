import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/app/_lib/utils";
import { getAccountingBlocks } from "@/app/_actions/get-accounting-blocks";
import { AccountingPageWrapper } from "@/app/_components/accounting-page-wrapper";
import { getUserBalance } from "@/app/_lib/actions/balance";

export const metadata = {
  title: "Prestação de Contas - Painel Criativa",
};

export default async function AccountingPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient.users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);

  const accountingBlocks = await getAccountingBlocks();
  const balances = await getUserBalance(); // This now returns all company balances

  return (
    <AccountingPageWrapper
      name={user.fullName ?? ""}
      userName={user.fullName ?? ""}
      userRole={userRole}
      accountingBlocks={accountingBlocks}
      userBalances={balances as { [key: string]: number }}
    />
  );
}
