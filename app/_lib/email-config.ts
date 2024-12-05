export const ALLOWED_TEST_EMAILS = [
  "seu-email@exemplo.com",
  "outro-email-de-teste@exemplo.com",
  // Adicione outros e-mails de teste aqui
];

export function isAllowedTestEmail(email: string): boolean {
  return (
    process.env.NODE_ENV !== "production" && ALLOWED_TEST_EMAILS.includes(email)
  );
}
