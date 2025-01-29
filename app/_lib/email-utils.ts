import resend from "./resend-config";
import {
  approvedRequestTemplate,
  deniedRequestTemplate,
  acceptedRequestTemplate,
} from "./email-templates";

export async function sendApprovedRequestEmail(
  to: string,
  userName: string,
  requestId: string,
  amount: number,
  depositProofUrl: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Criativa Energia <noreply@painel-criativa.vercel>",
      to: [to],
      subject: "Sua solicitação foi aprovada",
      html: approvedRequestTemplate(
        userName,
        requestId,
        amount,
        depositProofUrl,
      ),
    });

    if (error) {
      console.error("Error sending approved request email:", error);
      return false;
    }

    console.log("Approved request email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending approved request email:", error);
    return false;
  }
}

export async function sendDeniedRequestEmail(
  to: string,
  userName: string,
  requestId: string,
  amount: number,
  reason: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Criativa Energia <noreply@painel-criativa.vercel>",
      to: [to],
      subject: "Atualização sobre sua solicitação",
      html: deniedRequestTemplate(userName, requestId, amount, reason),
    });

    if (error) {
      console.error("Error sending denied request email:", error);
      return false;
    }

    console.log("Denied request email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending denied request email:", error);
    return false;
  }
}

export async function sendAcceptedRequestEmail(
  to: string,
  userName: string,
  requestId: string,
  amount: number,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Criativa Energia <noreply@painel-criativa.vercel>",
      to: [to],
      subject: "Sua solicitação foi aceita",
      html: acceptedRequestTemplate(userName, requestId, amount),
    });

    if (error) {
      console.error("Error sending accepted request email:", error);
      return false;
    }

    console.log("Accepted request email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending accepted request email:", error);
    return false;
  }
}
