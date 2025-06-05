/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/upload.ts
import { supabaseAdmin } from "./supabase";

export async function uploadPdfToSupabase(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("pdf")
    .upload(filename, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw new Error(`Erro ao enviar PDF: ${error.message}`);

  const publicUrl = supabaseAdmin.storage.from("pdf").getPublicUrl(filename)
    .data.publicUrl;

  return publicUrl;
}
