/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import { auth, clerkClient, type User } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendGZappyMessage } from "@/app/_lib/gzappy";
import { trackCreateRequest } from "../_lib/analytics";
import { RequestNotificationEmail } from "../_components/email-templates/request-notification-email";
import resend from "../_lib/resend-config";

interface CreateRequestData {
  name: string;
  description: string;
  amount: number;
  responsibleCompany: string;
  phoneNumber: string;
  gestor: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  pixKey: string;
}

interface NotificationData {
  userName: string;
  amount: number;
  company: string;
}

async function notifyManager(requestData: {
  userName: string;
  amount: number;
  company: string;
  requestName: string;
  description: string;
  managerEmail: string;
}) {
  try {
    await resend.emails.send({
      from: "Painel Criativa <notificacoes@nucleoenergy.com>",
      to: requestData.managerEmail,
      subject: "Nova Solicitação de Verba para Aprovação",
      react: RequestNotificationEmail({
        userName: requestData.userName,
        amount: requestData.amount,
        company: requestData.company,
        requestName: requestData.requestName,
        description: requestData.description,
      }),
    });
  } catch (error) {
    console.error("Error sending email notification:", error);
    // Não lançamos o erro para não bloquear a criação da solicitação
  }
}

export async function createRequest(data: CreateRequestData) {
  try {
    const { userId } = await auth();
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

    // Create the request
    const result = await db.$transaction(async (tx) => {
      let updatedDescription = data.description;

      if (balance.isNegative()) {
        updatedDescription += `\n\n - Valor a ser ressarcido ao usuario: R$${balance.abs().toFixed(2)}`;
      }

      const request = await tx.request.create({
        data: {
          userId,
          name: data.name,
          description: updatedDescription,
          amount: data.amount,
          currentBalance: requestedAmount,
          responsibleCompany: data.responsibleCompany,
          type: "DEPOSIT",
          status: "WAITING",
          phoneNumber: data.phoneNumber,
          initialUserBalance: balance,
          balanceDeducted: new Prisma.Decimal(0),
          gestor: data.gestor,
          responsibleValidationUserID: "",
          bankName: data.bankName,
          accountType: data.accountType,
          accountNumber: data.accountNumber,
          accountHolderName: data.accountHolderName,
          pixKey: data.pixKey,
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

    const userManager = await clerkClient.users.getUser(data.gestor);
    const managerEmail = userManager.emailAddresses[0]?.emailAddress;
    // Send notifications after successful request creation
    await notifyManager({
      userName: user.firstName ?? "Usuário",
      amount: data.amount,
      company: data.responsibleCompany,
      description: data.description,
      managerEmail: managerEmail,
      requestName: data.name,
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
