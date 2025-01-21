"use server";

import { db } from "@/app/_lib/prisma";
import type { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  denialReason?: string,
  proofBase64?: string,
) {
  try {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: { accountingBlock: true },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status === "COMPLETED") {
      throw new Error("Cannot modify a completed request");
    }

    const updateData: {
      status: RequestStatus;
      denialReason?: string | null;
      proofUrl?: string | null;
    } = {
      status: newStatus,
    };

    if (newStatus === "DENIED") {
      updateData.denialReason = denialReason;
    }

    if (newStatus === "COMPLETED" && proofBase64) {
      updateData.proofUrl = proofBase64;
    }

    // Use a transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Update request status
      await tx.request.update({
        where: { id: requestId },
        data: updateData,
      });

      // If the request is being accepted
      if (newStatus === "ACCEPTED" || newStatus === "COMPLETED") {
        const userBalance = await tx.userBalance.findFirst({
          where: {
            userId: request.userId,
            company: request.responsibleCompany,
          },
        });

        const currentBalance = userBalance
          ? userBalance.balance
          : new Prisma.Decimal(0);
        const requestedAmount = request.currentBalance; // This is the original requested amount
        let balanceDeducted = new Prisma.Decimal(0);

        // Deduct the requested amount from the user's balance
        if (currentBalance.gte(requestedAmount)) {
          // If balance is sufficient, deduct the full amount
          balanceDeducted = requestedAmount;
        } else {
          // If balance is insufficient, deduct whatever is available
          balanceDeducted = currentBalance;
        }

        const newBalance = currentBalance.minus(balanceDeducted);

        // Update user balance - using upsert without unique constraint
        if (userBalance) {
          await tx.userBalance.update({
            where: {
              id: userBalance.id,
            },
            data: {
              balance: newBalance,
            },
          });
        } else {
          await tx.userBalance.create({
            data: {
              userId: request.userId,
              company: request.responsibleCompany,
              balance: newBalance,
            },
          });
        }

        // Update request with deducted balance
        await tx.request.update({
          where: { id: requestId },
          data: {
            balanceDeducted: balanceDeducted,
            currentBalance: requestedAmount.minus(balanceDeducted), // Reduce the current balance by the deducted amount
          },
        });

        // Create accounting block if it doesn't exist
        if (!request.accountingBlock) {
          const blockCode = await generateAccountingBlockCode();

          await tx.accountingBlock.create({
            data: {
              code: blockCode,
              requestId: requestId,
              status: "OPEN",
              initialAmount: requestedAmount, // This is the original requested amount
              currentBalance: requestedAmount, // Initial balance minus deducted amount
              company: request.responsibleCompany,
            },
          });
        }
      }
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating request status:", error);
    throw new Error("Failed to update request status");
  }
}

async function generateAccountingBlockCode() {
  const latestBlock = await db.accountingBlock.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latestBlock) {
    return "01-PRC";
  }

  const latestNumber = Number.parseInt(latestBlock.code.split("-")[0]);
  const newNumber = latestNumber + 1;
  return `${newNumber.toString().padStart(2, "0")}-PRC`;
}
