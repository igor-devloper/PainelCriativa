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
}: PixData): string {
  // Format amount with exactly 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Clean merchant name - remove all non-alphanumeric characters and spaces
  const cleanName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();

  // Merchant Account Information - GUI + BR.GOV.BCB.PIX + PIX Key
  const gui = "br.gov.bcb.pix";
  const merchantAccInfo = `${gui}${padNumber(pixKey.length)}${pixKey}`;

  // Build the basic payload
  const payload = [
    "00020126", // Version + Initiation Method
    "580014", // GUI
    merchantAccInfo,
    "52040000", // Category Code
    "5303986", // Currency (BRL)
    `54${padNumber(formattedAmount.length)}${formattedAmount}`, // Amount
    "5802BR", // Country Code
    `59${padNumber(cleanName.length)}${cleanName}`, // Merchant Name
    "60065BRASIL", // City
    "62070503***", // Additional Data
    "6304", // CRC16
  ].join("");

  // Calculate CRC16 and append it
  const crc16 = calculateCRC16(payload);
  return payload + crc16;
}

function calculateCRC16(str: string): string {
  const polynomial = 0x1021;
  let crc = 0xffff;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ polynomial : crc << 1;
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}
