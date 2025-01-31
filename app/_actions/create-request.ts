/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import { auth, clerkClient, type User } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendGZappyMessage } from "@/app/_lib/gzappy";
import { trackCreateRequest } from "../_lib/analytics";

interface CreateRequestData {
  name: string;
  description: string;
  amount: number;
  responsibleCompany: string;
  phoneNumber: string;
  gestor: string;
}

interface NotificationData {
  userName: string;
  amount: number;
  company: string;
}

async function notifyAdminsAndFinance(requestData: NotificationData) {
  try {
    // Get all users with proper typing
    const users = await clerkClient.users.getUserList({
      limit: 100,
    });

    // Filter users with ADMIN or FINANCE role with type checking
    const adminsAndFinance = users.data.filter((user: User) => {
      const role = user.publicMetadata.role as string | undefined;
      return role === "ADMIN" || role === "FINANCE";
    });

    // Format the notification message
    const message =
      `🔔 Nova Solicitação de Verba\n\n` +
      `👤 Usuário: ${requestData.userName}\n` +
      `💰 Valor: R$ ${requestData.amount.toFixed(2)}\n` +
      `🏢 Empresa: ${requestData.company}\n\n` +
      `Acesse o painel para mais detalhes.`;

    // Send notifications to all admins and finance users
    const notifications = adminsAndFinance.map(async (user: User) => {
      const phoneNumber = user.phoneNumbers[0]?.phoneNumber;
      if (phoneNumber) {
        try {
          await sendGZappyMessage(phoneNumber, message);
        } catch (error) {
          console.error(`Failed to send notification to ${user.id}:`, error);
        }
      }
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error sending notifications:", error);
    // Don't throw the error to avoid blocking the request creation
  }
}

export async function createRequest(data: CreateRequestData) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    // Get user details for the notification with proper typing
    const user = await clerkClient.users.getUser(userId);

    // Validate input data
    if (
      !data.name ||
      !data.description ||
      !data.amount ||
      !data.responsibleCompany ||
      !data.phoneNumber
    ) {
      throw new Error("Todos os campos são obrigatórios");
    }

    // Fetch or create UserBalance for the specific company
    const userBalance = await db.userBalance.findFirst({
      where: {
        userId,
        company: data.responsibleCompany,
      },
    });

    const balance = userBalance ? userBalance.balance : new Prisma.Decimal(0);
    const requestedAmount = new Prisma.Decimal(data.amount);

    let totalRequestAmount: Prisma.Decimal;

    if (balance.isPositive()) {
      totalRequestAmount = requestedAmount.minus(balance);
      totalRequestAmount = totalRequestAmount.isNegative()
        ? new Prisma.Decimal(0)
        : totalRequestAmount;
    } else if (balance.isNegative()) {
      totalRequestAmount = requestedAmount.minus(balance);
    } else {
      totalRequestAmount = requestedAmount;
    }

    // Create the request
    const result = await db.$transaction(async (tx) => {
      let updatedDescription = data.description;

      if (balance.isPositive()) {
        const usedBalance = balance.gte(requestedAmount)
          ? requestedAmount
          : balance;
        updatedDescription += `\n\n - Saldo do usuario utilizado: R$${usedBalance.toFixed(2)}`;
      } else if (balance.isNegative()) {
        updatedDescription += `\n\n - Valor a ser ressarcido ao usuario: R$${balance.abs().toFixed(2)}`;
      }

      const request = await tx.request.create({
        data: {
          userId,
          name: data.name,
          description: updatedDescription,
          amount: totalRequestAmount,
          currentBalance: requestedAmount,
          responsibleCompany: data.responsibleCompany,
          status: "WAITING",
          phoneNumber: data.phoneNumber,
          initialUserBalance: balance,
          balanceDeducted: new Prisma.Decimal(0),
          gestor: data.gestor,
          responsibleValidationUserID: "",
        },
      });

      // if (request) {
      //   trackCreateRequest(data.amount);
      // }

      return {
        request,
        updatedDescription,
      };
    });

    // Send notifications after successful request creation
    await notifyAdminsAndFinance({
      userName: user.firstName ?? "Usuário",
      amount: data.amount,
      company: data.responsibleCompany,
    });

    revalidatePath("/requests");

    return {
      success: true,
      request: result,
    };
  } catch (error) {
    console.error("Error creating request:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro ao criar solicitação. Por favor, tente novamente.");
  }
}
