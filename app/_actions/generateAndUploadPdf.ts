/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateAccountingPDF } from "../_utils/generate-pdf";
import { db } from "../_lib/prisma";
import { uploadPdfToSupabase } from "../_lib/upload";

export async function generateAndUploadPdf(blockId: string): Promise<string> {
  const block = await db.accountingBlock.findUnique({
    where: { id: blockId },
    include: {
      expenses: true,
      request: true,
    },
  });

  if (!block) throw new Error("Bloco não encontrado");

  const companyName = block.code.split(" ")[0];
  const responsibleName = "Usuário Responsável";

  const doc = await generateAccountingPDF(
    {
      code: block.code,
      createdAt: block.createdAt,
      status: block.status,
      initialAmount: block.initialAmount ?? 0,
      expenses: block.expenses as any,
      request: block.request ?? undefined,
    },
    companyName,
    responsibleName,
  );

  const pdfBlob = doc.output("blob");
  const buffer = await pdfBlob.arrayBuffer();

  const pdfUrl = await uploadPdfToSupabase(
    Buffer.from(buffer),
    `${block.code}.pdf`,
  );

  return pdfUrl;
}
