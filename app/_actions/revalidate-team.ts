"use server";

import { revalidatePath } from "next/cache";

export async function revalidateTeam(teamId: string) {
  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
}
