import { BlockStatus } from "@prisma/client";

export const STATUS_BLOCK_LABEL: Record<BlockStatus, string> = {
  OPEN: "Aberto",
  CLOSED: "Fechado",
  APPROVED: "Aprovado",
  REPROVED: "Reprovado",
};

export type BlockStatusKey = keyof typeof STATUS_BLOCK_LABEL;
