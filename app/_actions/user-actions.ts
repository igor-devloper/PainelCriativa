/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { UserRole } from "@/app/types";

const userSchema = z.object({
  firstName: z.string().min(1, "O nome é obrigatório"),
  lastName: z.string().min(1, "O sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "USER", "FINANCE"] as const),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export async function createUser(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Não autorizado");
  }

  try {
    const validatedFields = userSchema.parse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });

    const user = await (
      await clerkClient()
    ).users.createUser({
      firstName: validatedFields.firstName,
      lastName: validatedFields.lastName,
      emailAddress: [validatedFields.email],
      password: validatedFields.password,
      publicMetadata: {
        role: validatedFields.role,
      },
    });

    revalidatePath("/users");
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error instanceof Error
      ? new Error(`Erro ao criar usuário: ${error.message}`)
      : new Error("Erro ao criar usuário");
  }
}

export async function updateUser(userId: string, formData: FormData) {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    throw new Error("Não autorizado");
  }

  try {
    const validatedFields = z
      .object({
        firstName: z.string().min(1, "O nome é obrigatório"),
        lastName: z.string().min(1, "O sobrenome é obrigatório"),
        role: z.enum(["ADMIN", "USER", "FINANCE"] as const),
      })
      .parse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        role: formData.get("role"),
      });

    const user = await (
      await clerkClient()
    ).users.updateUser(userId, {
      firstName: validatedFields.firstName,
      lastName: validatedFields.lastName,
      publicMetadata: {
        role: validatedFields.role,
      },
    });

    revalidatePath("/users");
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error instanceof Error
      ? new Error(`Erro ao atualizar usuário: ${error.message}`)
      : new Error("Erro ao atualizar usuário");
  }
}

export async function deleteUser(userId: string) {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    throw new Error("Não autorizado");
  }

  try {
    await (await clerkClient()).users.deleteUser(userId);
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error instanceof Error
      ? new Error(`Erro ao excluir usuário: ${error.message}`)
      : new Error("Erro ao excluir usuário");
  }
}
