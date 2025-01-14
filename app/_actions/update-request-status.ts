"use server";

import { db } from "@/app/_lib/prisma";
import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendWhatsAppMessage } from "@/app/_lib/twilio-client";

const STATUS_MESSAGES = {
  WAITING: "Sua solicitação está aguardando análise.",
  RECEIVED: "Sua solicitação foi recebida pelo financeiro e está em análise.",
  ACCEPTED: "Sua solicitação foi aceita! Em breve será finalizada.",
  DENIED: (reason: string) =>
    `Sua solicitação não foi aceita. Motivo: ${reason}`,
  COMPLETED:
    "Sua solicitação foi finalizada! Um bloco contábil foi criado para você registrar as despesas.",
};

async function generateAccountingBlockCode() {
  const latestBlock = await db.accountingBlock.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latestBlock) {
    return "01-PRC";
  }

  const latestNumber = parseInt(latestBlock.code.split("-")[0]);
  const newNumber = latestNumber + 1;
  return `${newNumber.toString().padStart(2, "0")}-PRC`;
}

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
      whatsappMessageId?: string | null;
      whatsappMessageStatus?: string;
      whatsappMessageError?: string | null;
    } = {
      status: newStatus,
    };

    if (newStatus === "DENIED") {
      updateData.denialReason = denialReason;
    }

    if (newStatus === "COMPLETED" && proofBase64) {
      updateData.proofUrl = proofBase64;
    }

    // Send WhatsApp message
    try {
      const message =
        newStatus === "DENIED"
          ? STATUS_MESSAGES.DENIED(denialReason || "Não especificado")
          : STATUS_MESSAGES[newStatus];
      console.log(request.phoneNumber);

      const whatsappResult = await sendWhatsAppMessage(
        request.phoneNumber,
        message,
      );

      updateData.whatsappMessageId = whatsappResult.messageId;
      updateData.whatsappMessageStatus = "sent";
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      updateData.whatsappMessageError =
        error instanceof Error ? error.message : "Unknown error";
      updateData.whatsappMessageStatus = "failed";
    }

    // Use a transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Update request status
      await tx.request.update({
        where: { id: requestId },
        data: updateData,
      });

      // Create accounting block if status is COMPLETED
      if (newStatus === "COMPLETED" && !request.accountingBlock) {
        const blockCode = await generateAccountingBlockCode();
        await tx.accountingBlock.create({
          data: {
            code: blockCode,
            requestId: requestId,
            status: "OPEN",
          },
        });
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
