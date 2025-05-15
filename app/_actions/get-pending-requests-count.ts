import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { getUserRole } from "@/app/_lib/utils";

export async function getPendingRequestsCount() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await (await clerkClient()).users.getUser(userId);
  const userRole = getUserRole(user.publicMetadata);

  let count;

  if (userRole === "ADMIN" || userRole === "FINANCE") {
    // Admins and Finance users can see all pending requests
    count = await db.request.count({
      where: {
        status: "WAITING",
      },
    });
  } else {
    // Regular users can only see their own pending requests
    count = await db.request.count({
      where: {
        userId: userId,
        status: "WAITING",
      },
    });
  }

  return count;
}
