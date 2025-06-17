/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/app/_lib/prisma";
import { serializeData } from "../_lib/utils";
import { UserRole } from "@/types";
import { ExpenseItem, ExpenseRequest } from "../types";


export async function getRequests(
  userRole: UserRole,
  userId: string,
): Promise<ExpenseRequest[]> {
  try {
    const where: any = {
      OR: [
        { userId: userId }, // My requests
        { gestor: userId }, // Requests where I'm the manager
        { responsibleValidationUserID: userId }, // Requests where I'm the validator
      ],
    };

    // If user is FINANCE or ADMIN, include all authorized requests
    if (userRole === "FINANCE" || userRole === "ADMIN") {
      where.OR.push({ status: { in: ["AUTHORIZES", "ACCEPTS", "COMPLETED"] } });
    }

    const requests = await db.request.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        accountingBlock: {
          include: {
            expenses: {
              orderBy: {
                createdAt: "desc",
              },
            },
            request: true,
          },
        },
      },
    });

    return serializeData(
      requests.map((request): ExpenseRequest => ({
        id: request.id,
        name: request.name,
        description: request.description,
        amount: request.amount.toNumber(),
        currentBalance: request.currentBalance?.toNumber() || null,
        initialUserBalance: request.initialUserBalance.toNumber(),
        balanceDeducted: request.balanceDeducted.toNumber(),
        status: request.status,
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        type: request.type,
        financeId: request.financeId,
        expectedDate: request.expectedDate,
        denialReason: request.denialReason,
        proofUrl: request.proofUrl,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        responsibleCompany: request.responsibleCompany,
        whatsappMessageId: request.whatsappMessageId,
        whatsappMessageStatus: request.whatsappMessageStatus,
        whatsappMessageError: request.whatsappMessageError,
        gestor: request.gestor,
        responsibleValidationUserID: request.responsibleValidationUserID,
        bankName: request.bankName,
        accountType: request.accountType,
        accountNumber: request.accountNumber,
        accountHolderName: request.accountHolderName,
        pixKey: request.pixKey,
        accountingBlock: request.accountingBlock ? {
          id: request.accountingBlock.id,
          code: request.accountingBlock.code,
          requestId: request.accountingBlock.requestId,
          status: request.accountingBlock.status,
          pdfUrl: request.accountingBlock.pdfUrl,
          initialAmount: request.accountingBlock.initialAmount.toNumber(),
          currentBalance: request.accountingBlock.currentBalance.toNumber(),
          saldoFinal: request.accountingBlock.saldoFinal?.toNumber() || null,
          createdAt: request.accountingBlock.createdAt,
          updatedAt: request.accountingBlock.updatedAt,
          company: request.accountingBlock.company,
          expenses: request.accountingBlock.expenses?.map((expense): ExpenseItem => ({
            id: expense.id,
            name: expense.name,
            description: expense.description,
            amount: expense.amount.toNumber(),
            category: expense.category,
            paymentMethod: expense.paymentMethod,
            blockId: expense.blockId,
            date: expense.date,
            status: expense.status,
            type: expense.type,
            userId: expense.userId,
            imageUrls: expense.imageUrls,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
            company: expense.company,
          })) || [],
        } : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching requests:", error);
    throw new Error("Failed to fetch requests");
  }
}
