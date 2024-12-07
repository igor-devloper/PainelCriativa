import { Resend } from "resend";
import { Transaction, Block } from "@prisma/client";
import { BlockClosedNotificationEmail } from "../_components/email-templates/deposit-notification";

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = "wagnerigor9@gmail.com";

export async function sendBlockClosedNotificationEmail(
  transaction: Transaction,
  block: Block,
) {
  try {
    const data = await resend.emails.send({
      from: "Painel de prestação de conta criativa <onboarding@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject: `Bloco Fechado: ${block.name} - Validação de Prestação de Contas Necessária`,
      react: BlockClosedNotificationEmail({ transaction, block }),
    });

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
