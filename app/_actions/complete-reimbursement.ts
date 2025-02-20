"use server";

import { db } from "@/app/_lib/prisma";
import { RequestStatus, BlockStatus } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendReimbursementProcessedEmail } from "@/app/_lib/email-utils";

export async function completeReimbursement(
  requestId: string,
  proofUrl: string,
) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db.$transaction(
    async (tx) => {
      const request = await tx.request.findUnique({
        where: { id: requestId },
        include: {
          accountingBlock: true,
        },
      });

      if (!request) {
        throw new Error("Solicitação não encontrada");
      }

      // Update request status and add proof
      await tx.request.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.COMPLETED,
          updatedAt: new Date(),
          proofUrl: proofUrl,
        },
      });

      // Close the accounting block if it exists
      if (request.accountingBlock) {
        await tx.accountingBlock.update({
          where: { id: request.accountingBlock.id },
          data: {
            status: BlockStatus.CLOSED,
          },
        });
      }

      // Find existing balance
      const existingBalance = await tx.userBalance.findFirst({
        where: {
          userId: request.userId,
          company: request.responsibleCompany,
        },
      });

      if (existingBalance) {
        const newBalance = existingBalance.balance.minus(request.amount);

        await tx.userBalance.update({
          where: {
            id: existingBalance.id,
          },
          data: {
            balance: newBalance,
          },
        });
      } else {
        throw new Error("Saldo do usuário não encontrado para dedução");
      }

      // Get user details from Clerk
      const user = await clerkClient.users.getUser(request.userId);
      const userEmail = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId,
      )?.emailAddress;

      if (userEmail) {
        await sendReimbursementProcessedEmail(
          userEmail,
          user.firstName || "Usuário",
          requestId,
          Number(request.amount),
          proofUrl,
        );
      }

      revalidatePath("/requests");
      revalidatePath(`/requests/${requestId}`);

      return {
        status: "success",
        message: "Reembolso processado com sucesso",
      };
    },
    {
      maxWait: 10000,
      timeout: 60000,
    },
  );
}
