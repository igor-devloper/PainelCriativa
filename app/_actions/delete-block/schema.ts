import { z } from "zod";

export const deleteBlockSchema = z.object({
  blockId: z.string().uuid(),
});

export type deleteBlockSchema = z.infer<typeof deleteBlockSchema>;
