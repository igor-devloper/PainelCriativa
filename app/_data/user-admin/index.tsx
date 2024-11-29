import { auth, clerkClient } from "@clerk/nextjs/server";

export const userAdmin = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const user = await clerkClient().users.getUser(userId);
  if (user.publicMetadata.subscriptionPlan === "admin") {
    return true;
  }
};
