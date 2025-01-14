/* eslint-disable @typescript-eslint/no-unused-vars */
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error("Twilio credentials not properly configured");
}

const client = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const formattedTo = `whatsapp:${to}`; // Twilio requires 'whatsapp:' prefix
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:+14155238886`,
      to: formattedTo,
    });
    console.log(response.body);
    return {
      success: true,
      messageId: response.sid,
    };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}
