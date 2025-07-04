/* eslint-disable @typescript-eslint/no-unused-vars */
import { UserRole } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export function formatDate(date: Date | string): string {
  // Ensure we have a valid Date object
  const dateObj = date instanceof Date ? date : new Date(date);

  // Validate the date
  if (isNaN(dateObj.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}

export function getNextBlockCode(lastCode: string | null): string {
  if (!lastCode) return "01-PRC";

  const currentNumber = parseInt(lastCode.split("-")[0]);
  return `${(currentNumber + 1).toString().padStart(2, "0")}-PRC`;
}

export function getUserRole(
  publicMetadata: Record<string, unknown> | null,
): UserRole {
  if (!publicMetadata) return "USER";
  return (publicMetadata.role as UserRole) || "USER";
}

export function canManageRequests(role: UserRole): boolean {
  return role === "ADMIN" || role === "FINANCE";
}

export function canCreateRequests(role: UserRole): boolean {
  return true; // Todos os usuários podem criar solicitações
}

export function canManageExpenses(role: UserRole): boolean {
  return role === "ADMIN" || role === "FINANCE";
}
export function generateBlockCode(lastCode: string | undefined) {
  if (!lastCode) {
    return "01-PRC";
  }
}
export function formatExpenseCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    FOODANDBEVERAGE: "Alimentação",
    ACCOMMODATION: "Hospedagem",
    TOLL: "Pedágio",
    FREIGHT: "Frete",
    POSTAGE: "Correios",
    PRINTING: "Impressão",
    FUEL: "Combustível",
    VEHICLERENTAL: "Aluguel de Veículo",
    TICKET: "Passagem",
    AIRTICKET: "Passagem Aérea",
    BUSTICKET: "Passagem Ônibus",
    VEHICLEWASH: "Lavagem",
    ADVANCE: "Adiantamento",
    SUPPLIES: "Suprimentos",
    OTHER: "Outros",
  };
  return categoryMap[category] || category;
}
