/* eslint-disable @typescript-eslint/no-unused-vars */
function pad(str: string, length: number): string {
  return str.padStart(length, "0");
}

function getCRC16(str: string): string {
  function crc16(str: string): number {
    let crc = 0xffff;
    let j: number;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      crc ^= c << 8;
      for (j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc;
  }

  const code = crc16(str).toString(16).toUpperCase();
  return pad(code, 4);
}

export function generatePixPayload(
  pixKey: string,
  amount: number,
  merchantName: string,
  merchantCity = "BRASIL",
  txid = "",
  description = "",
): string {
  // Remove any special characters and spaces from merchant name
  const cleanMerchantName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

  // Basic payload information
  const payload = [
    "01", // Payload version
    "12", // Single payment
    "26", // Merchant account information
    "00", // GUI
    "01", // PIX
    pad(pixKey.length.toString(), 2),
    pixKey,
    "52", // Merchant category code
    "04", // 0000
    "0000",
    "53", // Transaction currency
    "986", // BRL
    "54", // Transaction amount
    pad(amount.toFixed(2).length.toString(), 2),
    amount.toFixed(2),
    "58", // Country code
    "02", // BR
    "BR",
    "59", // Merchant name
    pad(cleanMerchantName.length.toString(), 2),
    cleanMerchantName,
    "60", // Merchant city
    pad(merchantCity.length.toString(), 2),
    merchantCity,
    "62", // Additional field
    "05", // Reference label
    "***",
  ];

  // Join all parts
  const payloadString = payload.join("");

  // Add CRC16
  const payloadWithCRC =
    payloadString + "6304" + getCRC16(payloadString + "6304");

  return payloadWithCRC;
}
