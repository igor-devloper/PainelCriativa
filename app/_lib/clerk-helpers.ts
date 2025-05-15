"use server";

import { cache } from "react";
import { clerkClient, currentUser, auth } from "@clerk/nextjs/server";

/**
 * Função em cache para obter um usuário pelo ID
 */
export const getClerkUser = cache(async (userId: string) => {
  return await clerkClient.users.getUser(userId);
});

/**
 * Função em cache para obter a lista de usuários
 */
export const getClerkUserList = cache(
  async (params?: {
    limit?: number;
    offset?: number;
    query?: string;
    emailAddress?: string[];
    userId?: string[];
    username?: string[];
    phoneNumber?: string[];
    externalId?: string[];
  }) => {
    return await clerkClient.users.getUserList(params);
  },
);

/**
 * Função em cache para obter o usuário atual autenticado
 */
export const getClerkCurrentUser = cache(async () => {
  return await currentUser();
});

/**
 * Função em cache para obter uma organização pelo ID
 */
export const getClerkOrganization = cache(async (organizationId: string) => {
  return await clerkClient.organizations.getOrganization({ organizationId });
});

/**
 * Função em cache para obter a lista de organizações
 */
export const getClerkOrganizationList = cache(async () => {
  return await clerkClient.organizations.getOrganizationList();
});

/**
 * Função em cache para obter os membros de uma organização
 */
export const getClerkOrganizationMemberships = cache(
  async (organizationId: string) => {
    return await clerkClient.organizations.getOrganizationMembershipList({
      organizationId,
    });
  },
);

/**
 * Função em cache para verificar a autenticação atual
 */
export const getClerkAuth = cache(async () => {
  return auth();
});

/**
 * Função em cache para obter metadados de usuário
 */
export const getUserMetadata = cache(async (userId: string) => {
  const user = await getClerkUser(userId);
  return {
    publicMetadata: user.publicMetadata,
    privateMetadata: user.privateMetadata,
    unsafeMetadata: user.unsafeMetadata,
  };
});

/**
 * Função em cache para buscar vários usuários por IDs
 */
export const getClerkUsersByIds = cache(async (userIds: string[]) => {
  if (!userIds.length) return [];

  const users = await Promise.all(
    userIds.map((id) => getClerkUser(id).catch(() => null)),
  );

  return users.filter(Boolean);
});
