interface PixData {
  pixKey: string;
  amount: number;
  merchantName: string;
  city?: string;
}

function padNumber(num: number): string {
  return num.toString().padStart(2, "0");
}

export function generatePixQRCode({
  pixKey,
  amount,
  merchantName,
  city = "BRASIL",
}: PixData): string {
  // Format amount with exactly 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Clean merchant name - remove accents and special characters
  const cleanName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/gi, "")
    .substring(0, 25)
    .trim()
    .toUpperCase();

  // Merchant Account Information for PIX
  // ID "26" for Merchant Account Information
  // "00" (ID) + "14" (length of "br.gov.bcb.pix") + "br.gov.bcb.pix"
  // "01" (ID) + "XX" (length of PIX key) + PIX key
  const pixDomain = "br.gov.bcb.pix";
  const merchantAccInfo = [
    "00", // ID for GUI
    padNumber(pixDomain.length),
    pixDomain,
    "01", // ID for PIX key
    padNumber(pixKey.length),
    pixKey,
  ].join("");

  // Build the payload
  const payload = [
    "00020126", // Version "01" + Initiation Method "26"
    `58${padNumber(merchantAccInfo.length)}${merchantAccInfo}`,
    "52040000", // Category Code "0000"
    "5303986", // Currency "986" (BRL)
    `54${padNumber(formattedAmount.length)}${formattedAmount}`,
    "5802BR", // Country Code
    `59${padNumber(cleanName.length)}${cleanName}`,
    `60${padNumber(city.length)}${city}`,
    "6304", // CRC16 (to be filled)
  ].join("");

  // Calculate and append CRC16
  const crc16 = calculateCRC16(payload);
  return payload + crc16;
}

function calculateCRC16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let pos = 0; pos < str.length; pos++) {
    crc ^= str.charCodeAt(pos) << 8;
    for (let i = 0; i < 8; i++) {
      crc = ((crc << 1) ^ (crc & 0x8000 ? polynomial : 0)) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}
