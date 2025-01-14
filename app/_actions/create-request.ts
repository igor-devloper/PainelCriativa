"use server";

import { db } from "@/app/_lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { auth } from "@clerk/nextjs/server";

interface CreateRequestData {
  userId: string;
  name: string;
  description: string;
  amount: number;
  responsibleCompany: string;
  phoneNumber: string;
}

export async function createRequest(data: CreateRequestData) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const request = await db.request.create({
      data: {
        name: data.name,
        description: data.description,
        amount: new Decimal(data.amount),
        currentBalance: new Decimal(data.amount),
        status: "WAITING",
        userId,
        responsibleCompany: data.responsibleCompany,
        phoneNumber: data.phoneNumber,
      },
      include: {
        accountingBlock: true,
      },
    });

    return request;
  } catch (error) {
    console.error("Error creating request:", error);
    throw new Error("Failed to create request");
  }
}
