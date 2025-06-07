/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAccountingPDF } from "@/app/_utils/generate-pdf";
import { db } from "../_lib/prisma";
import { uploadPdfToSupabase } from "../_lib/upload";

export async function closeAccountingBlock(blockId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Usuário não autenticado");

  const block = await db.accountingBlock.findUnique({
    where: { id: blockId },
    include: {
      expenses: true,
      request: true,
    },
  });

  if (!block) throw new Error("Bloco não encontrado");

  // Calcular saldo total
  const saldo = block.expenses.reduce((acc, t) => {
    return t.type === "CAIXA" ? acc + Number(t.amount) : acc - Number(t.amount);
  }, 0);

  // Validar fechamento com saldo negativo
  if (saldo < 0) {
    const temReembolso = block.expenses.some((t) => t.type === "REEMBOLSO");
    if (!temReembolso) {
      return {
        status: "awaiting_reimbursement",
        message:
          "Bloco com saldo negativo. Adicione um reembolso para poder fechar.",
      };
    }
  }

  // Gerar PDF
  const companyName = block.company;
  const responsibleName =
    block.request?.accountHolderName ?? "Usuário Responsável";

  const doc = await generateAccountingPDF(block, companyName, responsibleName);

  const pdfBlob = doc.output("blob");
  const buffer = await pdfBlob.arrayBuffer();
  const pdfUrl = await uploadPdfToSupabase(
    Buffer.from(buffer),
    `${block.code}.pdf`,
  );

  // Atualiza e apaga o bloco, despesas e request
  await db.$transaction(async (prisma) => {
    // Atualiza com status final e PDF
    await prisma.accountingBlock.update({
      where: { id: blockId },
      data: {
        status: "CLOSED",
        saldoFinal: block.currentBalance,
        pdfUrl,
        requestId: null,
      },
    });

    // Deleta despesas
    await prisma.expense.deleteMany({
      where: { blockId },
    });

    // Deleta request
    if (block.request?.id) {
      await prisma.request.delete({
        where: { id: block.request.id },
      });
    }

    // // Por fim, deleta o bloco
    // await prisma.accountingBlock.delete({
    //   where: { id: blockId },
    // });
  });

  revalidatePath("/accounting");

  return {
    status: "closed",
    saldoFinal: saldo,
    pdfUrl,
    message: "Bloco fechado com sucesso e dados apagados.",
  };
}
