import resend from "./resend-config";
import {
  approvedRequestTemplate,
  deniedRequestTemplate,
  acceptedRequestTemplate,
} from "./email-templates";

// Usando o email verificado do Resend para desenvolvimento e produção
// até que tenhamos um domínio verificado
const VERIFIED_EMAIL = "wagnerigor9@gmail.com";

async function sendEmail(to: string, subject: string, html: string) {
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
      // Log adicional para debug em produção
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
    // Log adicional para debug em produção
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
