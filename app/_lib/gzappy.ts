import axios from "axios";

const GZAPPY_API_BASE_URL = "https://api.gzappy.com/v1/messages"; // Atualize com a URL correta
const INSTANCE_ID = "WX46DAJH59M2YUKGSLQRWYZH"; // Substitua pelo ID da sua instância
const TOKEN =
  "5fb2377067f97158e99fc81a373ab3d90b211bc175c844c51ee351e643e36f02593c325e54fbfe2251a3f22aeb52ccd828861a3a0b2574de3ad6200277a80dda"; // Substitua pelo token fornecido pelo gZappy

export async function sendGZappyMessage(phoneNumber: string, message: string) {
  try {
    const response = await axios.post(
      GZAPPY_API_BASE_URL,
      {
        instanceId: INSTANCE_ID,
        token: TOKEN,
        phoneNumber,
        message,
      },
      {
        headers: {
          "Content-Type": "application/json",
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
