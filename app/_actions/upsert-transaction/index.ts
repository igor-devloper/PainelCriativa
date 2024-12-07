"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
  BlockStatus,
} from "@prisma/client";
import { upsertTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { sendBlockClosedNotificationEmail } from "@/app/_lib/send-email";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      const uploadedImages = await Promise.all(
        params.imagesBase64.map(async (imageBase64) => {
          const response = await cloudinary.uploader.upload(imageBase64);
          return response.secure_url;
        }),
      );
      imageUrls = uploadedImages;
    }

    const result = await db.$transaction(async (tx) => {
      // Get the current block
      const block = await tx.block.findUnique({
        where: { id: params.blockId },
        include: { team: true },
      });

      if (!block) {
        throw new Error("Block not found");
      }

      // Calculate the new block amount
      const amountChange =
        params.type === TransactionType.EXPENSE
          ? -params.amount
          : params.amount;
      const newBlockAmount = Number(block.amount) + amountChange;

      if (newBlockAmount < 0) {
        throw new Error("Insufficient funds in the block");
      }

      // Create or update the transaction
      const transaction = await tx.transaction.upsert({
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

      // Update the block
      const updatedBlock = await tx.block.update({
        where: { id: params.blockId },
        data: {
          amount: newBlockAmount,
          status: newBlockAmount === 0 ? BlockStatus.CLOSED : block.status,
        },
      });

      return { transaction, updatedBlock };
    });

    // If the block is now closed, send an email
    if (result.updatedBlock.status === BlockStatus.CLOSED) {
      await sendBlockClosedNotificationEmail(
        result.transaction,
        result.updatedBlock,
      );
    }
    console.log(`action upsert: teamId = ${params.teamId}`);
    revalidatePath("/transactions");
    revalidatePath("/admin");
    revalidatePath(`/teams/${params.teamId}`);
    return result.transaction;
  } catch (error) {
    console.error("Error in upsertTransaction:", error);
    throw error; // Re-throw the error to be handled by the client
  }
};

function filterParams(params: UpsertTransactionParams) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { imagesBase64, ...rest } = params;
  return rest;
}
