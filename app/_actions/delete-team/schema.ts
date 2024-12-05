import { z } from "zod";

export const deleteTeamSchema = z.object({
  teamId: z.string().uuid(),
});

export type deleteTeamSchema = z.infer<typeof deleteTeamSchema>;
