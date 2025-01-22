import axios from "axios";

const GZAPPY_API_BASE_URL = "https://api.gzappy.com/v1/message/send-message";
const INSTANCE_ID = process.env.GZAPPY_INSTANCE_ID;
const TOKEN = process.env.GZAPPY_API_KEY;

export async function sendGZappyMessage(phoneNumber: string, message: string) {
  try {
    const response = await axios.post(
      GZAPPY_API_BASE_URL,
      {
        instance_id: INSTANCE_ID,
        message: [message],
        phone: [phoneNumber],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
      },
    );

    if (response.data && response.data.status === "success") {
      return response.data;
    } else {
      throw new Error(`gZappy returned error: ${response.data.message}`);
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem pelo gZappy:", error);
  }
}
