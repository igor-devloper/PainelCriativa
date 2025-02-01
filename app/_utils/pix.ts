export function generatePixPayload(
  pixKey: string,
  amount: number,
  merchantName: string,
): string {
  // Format amount to always have 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Clean up merchant name - remove accents and special characters
  const cleanMerchantName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .substring(0, 25); // Max 25 characters

  // Build the payload following PIX dynamic QR code specification
  const payload = [
    "00020126", // versão do payload + initiation method
    "33", // merchant account information length
    `0014BR.GOV.BCB.PIX01${pixKey.length}${pixKey}`, // PIX key info
    "52040000", // merchant category code
    "5303986", // currency (986 = BRL)
    "54", // amount
    String(formattedAmount.length).padStart(2, "0"),
    formattedAmount,
    "5802BR", // country code
    "59", // merchant name
    String(cleanMerchantName.length).padStart(2, "0"),
    cleanMerchantName,
    "60", // merchant city
    "07",
    "BRASIL",
    "6207", // additional data field
    "0503***",
    "6304", // CRC16 (will be calculated)
  ].join("");

  return payload;
}
