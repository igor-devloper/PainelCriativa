import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const userAdmin = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const user = await clerkClient().users.getUser(userId);
  if (user.publicMetadata.role === "admin") {
    return true;
  }
};
