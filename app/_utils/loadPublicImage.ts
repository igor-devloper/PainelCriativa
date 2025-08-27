// app/_utils/loadPublicImage.ts
import { promises as fs } from "node:fs";
import path from "node:path";

export async function loadPublicImageAsDataURL(relPath: string) {
  const abs = path.join(process.cwd(), "public", relPath.replace(/^\/+/, ""));
  const buf = await fs.readFile(abs);
  const ext = path.extname(abs).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
    "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
