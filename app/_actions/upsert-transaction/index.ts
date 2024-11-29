"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { upsertTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

// Configura o Cloudinary
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("Cloudinary credentials are missing");
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UpsertTransactionParams {
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  descripiton?: string;
  paymentMethod: TransactionPaymentMethod;
  imageBase64?: string; // Adiciona a imagem no formato base64
  date: Date;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  // Valida os parâmetros usando o schema
  upsertTransactionSchema.parse(params);

  // Obtém o userId a partir da autenticação
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Variável para armazenar a URL da imagem
  let imageUrl: string | undefined = undefined;

  // Se a imagem em base64 for fornecida, tenta fazer o upload para o Cloudinary
  if (params.imageBase64) {
    try {
      // Verifica se a string da imagem base64 já contém o prefixo necessário
      const base64Image = params.imageBase64.startsWith("data:image")
        ? params.imageBase64
        : `data:image/jpeg;base64,${params.imageBase64}`;

      // Realiza o upload da imagem para o Cloudinary
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "transactions", // Pasta no Cloudinary para organizar as imagens
        resource_type: "image", // Define o tipo de recurso como imagem
      });

      // Obtém a URL segura da imagem enviada
      imageUrl = uploadResult.secure_url;
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      throw new Error(
        "Não foi possível fazer o upload da imagem para o Cloudinary. Por favor, tente novamente.",
      );
    }
  }

  // Realiza o upsert na base de dados sem passar o campo imageBase64
  await db.transaction.upsert({
    update: {
      ...filterParams(params),
      imageUrl,
      userId,
    },
    create: {
      ...filterParams(params),
      imageUrl,
      userId,
    },
    where: {
      id: params?.id ?? "", // Verifica o id ou cria um novo
    },
  });

  // Revalida o caminho para atualizar a UI, se necessário
  revalidatePath("/transactions");
};

// Função para filtrar os parâmetros e remover imageBase64
function filterParams(params: UpsertTransactionParams) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { imageBase64, ...rest } = params;
  return rest;
}
