/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserRole } from "@/app/_lib/utils";
import { UserRole } from "@/app/types";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await (await clerkClient()).users.getUser(userId);
    const userRole = getUserRole(user.publicMetadata);

    if (userRole !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { userId: targetUserId, role } = await request.json();

    if (
      !targetUserId ||
      !role ||
      !["ADMIN", "FINANCE", "USER"].includes(role)
    ) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    await (
      await clerkClient()
    ).users.updateUser(targetUserId, {
      publicMetadata: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
