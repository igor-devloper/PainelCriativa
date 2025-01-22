/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/app/_lib/prisma";
import type { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { sendGZappyMessage } from "@/app/_lib/gzappy";

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

    await db.$transaction(async (tx) => {
      await tx.request.update({
        where: { id: requestId },
        data: updateData,
      });

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
        const requestedAmount = request.currentBalance;
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
              balance: currentBalance.minus(balanceDeducted),
            },
          });
        } else {
          await tx.userBalance.create({
            data: {
              userId: request.userId,
              company: request.responsibleCompany,
              balance: new Prisma.Decimal(0),
            },
          });
        }

        await tx.request.update({
          where: { id: requestId },
          data: {
            balanceDeducted: balanceDeducted,
            currentBalance: requestedAmount.minus(balanceDeducted),
          },
        });

        if (!request.accountingBlock) {
          const blockCode = await generateAccountingBlockCode();

          await tx.accountingBlock.create({
            data: {
              code: blockCode,
              requestId: requestId,
              status: "OPEN",
              initialAmount: requestedAmount,
              currentBalance: requestedAmount,
              company: request.responsibleCompany,
            },
          });
        }
      }

      const message = getGZappyMessage(
        request,
        newStatus,
        denialReason,
        proofBase64,
      );

      await sendMessageThroughGZappy(
        tx,
        request.phoneNumber,
        message,
        requestId,
      );
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);

    return {
      success: true,
      request: {
        ...request,
        // Converta os objetos Decimal para string
        currentBalance: request.currentBalance.toString(),
        initialUserBalance: request.initialUserBalance.toString(),
        balanceDeducted: request.balanceDeducted.toString(),
        amount: request.amount.toString(),
      },
    };
  } catch (error) {
    console.error("Error updating request status:", error);
    throw new Error("Failed to update request status");
  }
}

function getGZappyMessage(
  request: any,
  status: RequestStatus,
  denialReason?: string,
  proofBase64?: string,
): string {
  switch (status) {
    case "ACCEPTED":
      return (
        `🔔 Solicitação de Verba Aceita\n\n` +
        `👤 Usuário: ${request.userName}\n` +
        `💰 Valor: R$ ${request.amount.toFixed(2)}\n` +
        `🏢 Empresa: ${request.company}\n\n` +
        `Sua solicitação de verba foi aceita e está em processamento. Em breve você receberá mais informações.\n\n` +
        `Acesse o painel para mais detalhes.`
      );

    case "DENIED":
      return (
        `🔔 Solicitação de Verba Negada\n\n` +
        `👤 Usuário: ${request.userName}\n` +
        `💰 Valor: R$ ${request.amount.toFixed(2)}\n` +
        `🏢 Empresa: ${request.company}\n\n` +
        `Infelizmente, sua solicitação de verba foi negada.\n\n` +
        `Motivo: ${denialReason}\n\n` +
        `Se você tiver alguma dúvida, por favor, entre em contato com nossa equipe de suporte.`
      );

    case "COMPLETED":
      return (
        `🔔 Solicitação de Verba Concluída\n\n` +
        `👤 Usuário: ${request.userName}\n` +
        `💰 Valor: R$ ${request.amount.toFixed(2)}\n` +
        `🏢 Empresa: ${request.company}\n\n` +
        `💵 Link docomprovante: ${proofBase64}` +
        `Sua solicitação de verba foi finalizada com sucesso!\n\n` +
        `Você pode acessar os detalhes da transação no painel.\n\n` +
        `Obrigado por sua paciência.`
      );

    default:
      return (
        `🔔 Atualização sobre Solicitação de Verba\n\n` +
        `👤 Usuário: ${request.userName}\n` +
        `💰 Valor: R$ ${request.amount.toFixed(2)}\n` +
        `🏢 Empresa: ${request.company}\n\n` +
        `O status da sua solicitação de verba foi atualizado para ${status}.\n\n` +
        `Acesse o painel para mais detalhes.`
      );
  }
}

async function sendMessageThroughGZappy(
  tx: Prisma.TransactionClient,
  phoneNumber: string,
  message: string,
  requestId: string,
) {
  try {
    const gZappyResponse = await sendGZappyMessage(phoneNumber, message);
    await tx.request.update({
      where: { id: requestId },
      data: {
        whatsappMessageId: gZappyResponse.id,
        whatsappMessageStatus: gZappyResponse.status,
      },
    });
  } catch (error) {
    console.error("Error sending gZappy message:", error);
    await tx.request.update({
      where: { id: requestId },
      data: {
        whatsappMessageError:
          error instanceof Error ? error.message : String(error),
        whatsappMessageStatus: "ERROR",
      },
    });
  }
}

async function generateAccountingBlockCode(): Promise<string> {
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
