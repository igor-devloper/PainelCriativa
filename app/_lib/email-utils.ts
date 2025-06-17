import resend from "./resend-config";
import {
  approvedRequestTemplate,
  deniedRequestTemplate,
  acceptedRequestTemplate,
} from "./email-templates";
import { clerkClient } from "@clerk/nextjs/server";
import { UserRole } from "@/types";

// Usando o email verificado do Resend para desenvolvimento e produção
// até que tenhamos um domínio verificado
const VERIFIED_EMAIL = "Painel Criativa <notificacoes@nucleoenergy.com>";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Sempre enviamos do email verificado
    const { data, error } = await resend.emails.send({
      from: VERIFIED_EMAIL,
      to: [to],
      subject: subject,
      html: html,
      // Adicionando reply-to para que as respostas vão para o endereço correto
      replyTo: "noreply@criativaenergia.com.br",
    });

    if (error) {
      console.error("Error sending email:", error);
      console.error("Email details:", {
        to,
        subject,
        error: JSON.stringify(error),
      });
      return false;
    }

    console.log("Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    console.error("Email sending error details:", {
      to,
      subject,
      error: JSON.stringify(error),
    });
    return false;
  }
}

export async function sendApprovedRequestEmail(
  to: string,
  userName: string,
  requestId: string,
  amount: number,
  depositProofUrl: string,
) {
  return sendEmail(
    to,
    "Sua solicitação foi aprovada",
    approvedRequestTemplate(userName, requestId, amount, depositProofUrl),
  );
}

export async function sendDeniedRequestEmail(
  to: string,
  userName: string,
  requestId: string,
  amount: number,
  reason: string,
) {
  return sendEmail(
    to,
    "Atualização sobre sua solicitação",
    deniedRequestTemplate(userName, requestId, amount, reason),
  );
}

export async function sendAcceptedRequestEmail(
  to: string,
  userName: string,
  requestId: string,
  amount: number,
) {
  return sendEmail(
    to,
    "Sua solicitação foi aceita",
    acceptedRequestTemplate(userName, requestId, amount),
  );
}

export async function sendReimbursementRequestEmail(
  userEmail: string,
  userName: string,
  requestId: string,
  amount: number,
) {
  return sendEmail(
    userEmail,
    "Solicitação de Reembolso Criada",
    `
      <h1>Olá ${userName},</h1>
      <p>Uma solicitação de reembolso foi criada para você no valor de R$ ${amount.toFixed(2)}.</p>
      <p>ID da solicitação: ${requestId}</p>
      <p>Você será notificado quando o reembolso for processado.</p>
    `,
  );
}

export async function sendReimbursementProcessedEmail(
  userEmail: string,
  userName: string,
  requestId: string,
  amount: number,
  proofUrl: string,
) {
  return sendEmail(
    userEmail,
    "Reembolso Processado",
    `
      <h1>Olá ${userName},</h1>
      <p>Seu reembolso no valor de R$ ${amount.toFixed(2)} foi processado.</p>
      <p>ID da solicitação: ${requestId}</p>
      <p>Comprovante: <a href="${proofUrl}" target="_blank">Visualizar comprovante</a></p>
    `,
  );
}

export async function notifyAdminsAndFinance({
  title,
  message,
  requestId,
}: {
  title: string;
  message: string;
  requestId: string;
}) {
  try {
    const users = await (await clerkClient()).users.getUserList();

    const adminAndFinanceUsers = users.data.filter((user) => {
      const role = user.publicMetadata.role as UserRole;
      return role === "ADMIN" || role === "FINANCE";
    });

    for (const user of adminAndFinanceUsers) {
      const emailAddress = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId,
      );
      if (emailAddress) {
        await sendEmail(
          emailAddress.emailAddress,
          title,
          `
            <h1>${title}</h1>
            <p>${message}</p>
            <p>Acesse o painel para processar esta solicitação.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/${requestId}">
              Ver solicitação
            </a>
          `,
        );
      }
    }

    console.log(`Notifications sent to ${adminAndFinanceUsers.length} users`);
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
}
