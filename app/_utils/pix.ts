/* eslint-disable prefer-const */
interface PixData {
  pixKey: string;
  amount: number;
  merchantName: string;
  city?: string;
  txid?: string;
}

function padNumber(num: number): string {
  return num.toString().padStart(2, "0");
}

export function generatePixQRCode({
  pixKey,
  amount,
  merchantName,
  city = "BRASIL",
  txid = "***",
}: PixData): string {
  const formattedAmount = amount.toFixed(2);

  const cleanName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/gi, "")
    .substring(0, 25)
    .trim()
    .toUpperCase();

  const pixDomain = "br.gov.bcb.pix";
  const merchantAccInfo = [
    "00",
    padNumber(pixDomain.length),
    pixDomain,
    "01",
    padNumber(pixKey.length),
    pixKey,
  ].join("");

  const merchantField = `26${padNumber(merchantAccInfo.length)}${merchantAccInfo}`;

  const txidField = `62${padNumber(txid.length + 4)}0503${txid}`;

  let payload = [
    "000201", // Payload Format Indicator
    merchantField,
    "52040000", // Merchant Category Code
    "5303986", // Currency Code (BRL)
    `54${padNumber(formattedAmount.length)}${formattedAmount}`,
    "5802BR", // Country Code
    `59${padNumber(cleanName.length)}${cleanName}`,
    `60${padNumber(city.length)}${city}`,
    txidField,
    "6304", // CRC16 placeholder
  ].join("");

  // Calcula o CRC16
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
