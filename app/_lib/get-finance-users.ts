"use server";

import { clerkClient } from "@clerk/nextjs/server";

export async function getFinanceUsers() {
  try {
    const users = await (
      await clerkClient()
    ).users.getUserList({
      orderBy: "-created_at",
    });

    // Filter users with FINANCE or ADMIN role
    const financeUsers = users.data.filter((user) => {
      const publicMetadata = user.publicMetadata;
      const role = publicMetadata.role as string;
      return role === "FINANCE" || role === "ADMIN";
    });

    return financeUsers
      .map((user) => ({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
      }))
      .filter((user) => user.email); // Only return users with email addresses
  } catch (error) {
    console.error("Error fetching finance users:", error);
    return [];
  }
}
