"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function uploadProof(requestId: string, imagesBase64: string[]) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const request = await db.request.update({
      where: { id: requestId },
      data: {
        proofUrl: imagesBase64[0], // Assuming we're only using the first image
      },
    });

    revalidatePath("/requests");
    revalidatePath("/");

    return {
      success: true,
      data: request,
    };
  } catch (error) {
    console.error("Error uploading proof:", error);
    throw new Error("Failed to upload proof");
  }
}
