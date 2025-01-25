import type { UserRole } from "../types/dashboard";

export function getUserRole(
  metadata: Record<string, unknown> | null,
): UserRole {
  if (!metadata) return "USER";

  const role = metadata.role as string;

  if (role === "ADMIN" || role === "FINANCE" || role === "USER") {
    return role as UserRole;
  }

  return "USER";
}
