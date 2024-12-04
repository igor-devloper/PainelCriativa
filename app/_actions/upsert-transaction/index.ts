/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { upsertTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { sendDepositNotificationEmail } from "@/app/_lib/send-email";

// Cloudinary configuration
if (
  !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("Cloudinary credentials are missing");
  throw new Error("Server configuration error");
}

try {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (error) {
  console.error("Error configuring Cloudinary:", error);
  throw new Error("Server configuration error");
}

interface UpsertTransactionParams {
  userId?: string;
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description?: string;
  paymentMethod: TransactionPaymentMethod;
  imagesBase64?: string[];
  date: Date;
  teamId: string;
  blockId: string;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  try {
    // Validate parameters using the schema
    upsertTransactionSchema.parse(params);

    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let imageUrls: string[] = [];

    if (params.imagesBase64 && params.imagesBase64.length > 0) {
      try {
        const uploadPromises = params.imagesBase64.map(async (base64Image) => {
          const imageData = base64Image.startsWith("data:image")
            ? base64Image
            : `data:image/jpeg;base64,${base64Image}`;

          const uploadResult = await cloudinary.uploader.upload(imageData, {
            folder: "transactions",
            resource_type: "image",
          });

          return uploadResult.secure_url;
        });

        imageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Error uploading images:", error);
        throw new Error("Unable to upload images. Please try again.");
      }
    }

    const transaction = await db.transaction.upsert({
      update: {
        ...filterParams(params),
        imageUrl: imageUrls,
      },
      create: {
        ...filterParams(params),
        imageUrl: imageUrls,
        userId,
      },
      where: {
        id: params?.id ?? "",
      },
    });

    await sendDepositNotificationEmail(transaction);

    revalidatePath("/transactions");
    revalidatePath("/admin");
    return transaction;
  } catch (error) {
    console.error("Error in upsertTransaction:", error);
    throw error; // Re-throw the error to be handled by the client
  }
};

function filterParams(params: UpsertTransactionParams) {
  const { imagesBase64, ...rest } = params;
  return rest;
}
