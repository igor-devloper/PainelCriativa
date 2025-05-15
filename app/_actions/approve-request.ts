"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function approveRequest(requestId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const request = await db.request.update({
      where: { id: requestId },
      data: {
        status: "ACCEPTS",
        financeId: userId,
      },
    });

    revalidatePath("/requests");
    revalidatePath("/");

    return {
      success: true,
      data: request,
    };
  } catch (error) {
    console.error("Error approving request:", error);
    throw new Error("Failed to approve request");
  }
}
