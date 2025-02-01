"use server";

import { db } from "@/app/_lib/prisma";
import type { Request, RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
// import { REQUEST_STATUS_LABELS } from "../_constants/transactions"
import {
  sendApprovedRequestEmail,
  sendAcceptedRequestEmail,
} from "@/app/_lib/email-utils";

export async function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  denialReason?: string,
  proofBase64?: string,
  responsibleValidationUserID?: string,
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
      responsibleValidationUserID?: string | null;
    } = {
      status: newStatus,
    };

    if (newStatus === "COMPLETED" && proofBase64) {
      updateData.proofUrl = proofBase64;
    }
    if (newStatus === "VALIDATES" && responsibleValidationUserID) {
      updateData.responsibleValidationUserID = responsibleValidationUserID;
    }

    let updatedRequest: Request;

    await db.$transaction(
      async (tx) => {
        updatedRequest = await tx.request.update({
          where: { id: requestId },
          data: updateData,
        });

        if (newStatus === "COMPLETED") {
          const userBalance = await tx.userBalance.findFirst({
            where: {
              userId: updatedRequest.userId,
              company: updatedRequest.responsibleCompany,
            },
          });

          const currentBalance = userBalance
            ? userBalance.balance
            : new Prisma.Decimal(0);
          const requestedAmount =
            updatedRequest.currentBalance || new Prisma.Decimal(0);
          let balanceDeducted = new Prisma.Decimal(0);

          if (currentBalance.gte(requestedAmount)) {
            balanceDeducted = requestedAmount;
          } else {
            balanceDeducted = currentBalance;
          }

          if (userBalance) {
            await tx.userBalance.update({
              where: {
                id: userBalance.id,
              },
              data: {
                balance: updatedRequest.amount,
              },
            });
          } else {
            await tx.userBalance.create({
              data: {
                userId: updatedRequest.userId,
                company: updatedRequest.responsibleCompany,
                balance: updatedRequest.currentBalance || new Prisma.Decimal(0),
              },
            });
          }

          updatedRequest = await tx.request.update({
            where: { id: requestId },
            data: {
              balanceDeducted: balanceDeducted,
              currentBalance: requestedAmount.minus(balanceDeducted),
            },
          });

          if (!request.accountingBlock) {
            const blockCode = await generateAccountingBlockCode(
              request.responsibleCompany,
            );

            await tx.accountingBlock.create({
              data: {
                code: blockCode,
                requestId: requestId,
                status: "OPEN",
                initialAmount: requestedAmount,
                currentBalance: requestedAmount,
                company: updatedRequest.responsibleCompany,
              },
            });
          }
        }

        // Fetch user data from Clerk
        const user = await clerkClient.users.getUser(updatedRequest.userId);

        // Send email notification
        await sendEmailNotification(
          updatedRequest,
          user.emailAddresses[0].emailAddress,
          user.firstName || "Usuário",
          newStatus,
          denialReason,
          proofBase64,
        );
      },
      {
        maxWait: 10000,
        timeout: 60000,
      },
    );

    // Force revalidation after the transaction is complete
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating request status:", error);
    throw new Error("Failed to update request status");
  }
}

async function sendEmailNotification(
  request: Request,
  userEmail: string,
  userName: string,
  status: RequestStatus,
  denialReason?: string,
  proofBase64?: string,
) {
  const { id, amount } = request;

  switch (status) {
    case "ACCEPTS":
      await sendAcceptedRequestEmail(
        userEmail,
        userName,
        id,
        amount.toNumber(),
      );
      break;
    case "COMPLETED":
      await sendApprovedRequestEmail(
        userEmail,
        userName,
        id,
        amount.toNumber(),
        proofBase64 || "",
      );
      break;
    default:
      // For other statuses, you might want to implement a generic status update email
      break;
  }
}
const COMPANY_PREFIXES: Record<string, string> = {
  "GSM SOLARION 02": "SOL",
  "CRIATIVA ENERGIA": "CRIA",
  "OESTE BIOGÁS": "BIO",
  "EXATA I": "EXA",
};

async function generateAccountingBlockCode(
  companyName: string,
): Promise<string> {
  const latestBlock = await db.accountingBlock.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const latestNumber = latestBlock
    ? parseInt(latestBlock.code.split(" ")[1])
    : 0;
  const newNumber = (latestNumber + 1).toString().padStart(3, "0");

  const prefix = COMPANY_PREFIXES[companyName] || "GEN";

  return `PC ${newNumber} ${prefix}`;
}
