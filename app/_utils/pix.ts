interface PixData {
  pixKey: string;
  amount: number;
  merchantName: string;
  city?: string;
}

function createCRC16(str: string): string {
  const polynomial = 0x1021;
  let crc = 0xffff;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixQRCode({
  pixKey,
  amount,
  merchantName,
  city = "BRASIL",
}: PixData): string {
  // Clean and format merchant name (remove accents and special chars)
  const cleanName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/gi, "")
    .trim()
    .substring(0, 25)
    .toUpperCase();

  // Format amount with exactly 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Build the payload parts
  const payloadParts = {
    formatIndicator: "000201",
    merchantAccountInfo: {
      gui: "26",
      specificData: [
        "0014BR.GOV.BCB.PIX",
        `01${pixKey.length.toString().padStart(2, "0")}${pixKey}`,
      ].join(""),
    },
    merchantCategCode: "52040000",
    transactionCurrency: "5303986",
    transactionAmount: `54${formattedAmount.length.toString().padStart(2, "0")}${formattedAmount}`,
    countryCode: "5802BR",
    merchantName: `59${cleanName.length.toString().padStart(2, "0")}${cleanName}`,
    merchantCity: `60${city.length.toString().padStart(2, "0")}${city}`,
    additionDataField: "62070503***",
  };

  // Combine all parts
  const basePayload = [
    payloadParts.formatIndicator,
    payloadParts.merchantAccountInfo.gui +
      payloadParts.merchantAccountInfo.specificData,
    payloadParts.merchantCategCode,
    payloadParts.transactionCurrency,
    payloadParts.transactionAmount,
    payloadParts.countryCode,
    payloadParts.merchantName,
    payloadParts.merchantCity,
    payloadParts.additionDataField,
  ].join("");

  // Add CRC
  const payloadWithCRC = basePayload + "6304";
  const crc = createCRC16(payloadWithCRC);

  return payloadWithCRC + crc;
}
