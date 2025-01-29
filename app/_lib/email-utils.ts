import resend from "./resend-config";
import {
  approvedRequestTemplate,
  deniedRequestTemplate,
  acceptedRequestTemplate,
} from "./email-templates";

const isDevelopment = process.env.NODE_ENV === "development";
const testEmailAddress = "wagnerigor9@gmail.com";
const productionFromAddress = "Painel Criativa <noreply@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  const fromAddress = isDevelopment ? testEmailAddress : productionFromAddress;
  const toAddress = isDevelopment ? testEmailAddress : to;

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toAddress],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return false;
    }

    console.log("Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
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
