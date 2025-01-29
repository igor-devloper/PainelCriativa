import { formatCurrency } from "./utils";

// Função auxiliar para obter a URL base do site
function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback para ambiente de servidor
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export function approvedRequestTemplate(
  userName: string,
  requestId: string,
  amount: number,
  depositProofUrl: string,
) {
  const baseUrl = getBaseUrl();
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitação Aprovada</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { background-color: #ffffff; padding: 20px; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${baseUrl}/logo.png" alt="Logo da Empresa" style="max-width: 200px;">
        </div>
        <div class="content">
          <h2>Olá, ${userName}!</h2>
          <p>Sua solicitação de ID ${requestId} foi aprovada.</p>
          <p>Valor aprovado: ${formatCurrency(amount)}</p>
          <p>O depósito foi realizado e você pode verificar o comprovante clicando no botão abaixo:</p>
          <p><a href="${depositProofUrl}" class="button">Ver Comprovante</a></p>
          <p>Se você tiver alguma dúvida, por favor, entre em contato conosco.</p>
        </div>
        <div class="footer">
          <p>&copy; 2023 Sua Empresa. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function deniedRequestTemplate(
  userName: string,
  requestId: string,
  amount: number,
  reason: string,
) {
  const baseUrl = getBaseUrl();
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitação Negada</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { background-color: #ffffff; padding: 20px; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; }
        .reason { background-color: #ffeeee; padding: 15px; border-left: 5px solid #ff0000; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${baseUrl}/logo.png" alt="Logo da Empresa" style="max-width: 200px;">
        </div>
        <div class="content">
          <h2>Olá, ${userName}!</h2>
          <p>Infelizmente, sua solicitação de ID ${requestId} foi negada.</p>
          <p>Valor solicitado: ${formatCurrency(amount)}</p>
          <div class="reason">
            <h3>Motivo da negação:</h3>
            <p>${reason}</p>
          </div>
          <p>Se você tiver alguma dúvida ou quiser mais informações, por favor, entre em contato conosco.</p>
        </div>
        <div class="footer">
          <p>&copy; 2023 Sua Empresa. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function acceptedRequestTemplate(
  userName: string,
  requestId: string,
  amount: number,
) {
  const baseUrl = getBaseUrl();
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitação Aceita</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { background-color: #ffffff; padding: 20px; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${baseUrl}/logo.png" alt="Logo da Empresa" style="max-width: 200px;">
        </div>
        <div class="content">
          <h2>Olá, ${userName}!</h2>
          <p>Sua solicitação de ID ${requestId} foi aceita e está em processamento.</p>
          <p>Valor solicitado: ${formatCurrency(amount)}</p>
          <p>Em breve você receberá mais informações sobre o status da sua solicitação.</p>
          <p>Se você tiver alguma dúvida, por favor, entre em contato conosco.</p>
        </div>
        <div class="footer">
          <p>&copy; 2023 Sua Empresa. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
