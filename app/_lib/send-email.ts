import { Resend } from "resend";
import { Transaction, Block } from "@prisma/client";
import { DepositNotificationEmail } from "../_components/email-templates/deposit-notification";
import { TRANSACTION_TYPE_OPTIONS_LABELS } from "../_constants/transactions";

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = "wagnerigor9@gmail.com";

export async function sendDepositNotificationEmail(transaction: Transaction) {
  try {
    const data = await resend.emails.send({
      from: "Painel de prestação de conta criativa <onboarding@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject: `Novo(a) ${TRANSACTION_TYPE_OPTIONS_LABELS[transaction.type]}: R$ ${Number(transaction.amount).toFixed(2)}`,
      react: DepositNotificationEmail({ transaction }),
    });

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendBlockClosedNotificationEmail(
  transaction: Transaction,
  block: Block,
) {
  try {
    const data = await resend.emails.send({
      from: "Painel de prestação de conta criativa <onboarding@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject: `Bloco Fechado: ${block.name} - Validação de Prestação de Contas Necessária`,
      react: DepositNotificationEmail({ transaction, block }),
    });

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
