import axios from "axios";
import { config } from "../config/env";

export interface SendTextMessageParams {
  phoneNumberId: string;
  whatsappToken: string;
  to: string;
  text: string;
}

/**
 * Envía un mensaje de texto plano al usuario a través de la WhatsApp Cloud API de Meta
 */
export async function sendWhatsAppMessage(
  params: SendTextMessageParams,
): Promise<void> {
  const { phoneNumberId, whatsappToken, to, text } = params;
  const url = `https://graph.facebook.com/${config.metaGraphApiVersion}/${phoneNumberId}/messages`;

  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    };

    const headers = {
      Authorization: `Bearer ${whatsappToken}`,
      "Content-Type": "application/json",
    };

    await axios.post(url, payload, { headers, timeout: 10000 });
  } catch (error: any) {
    console.error(
      `[WhatsApp API Error] Fallo al enviar mensaje a ${to} (Phone ID: ${phoneNumberId}):`,
      error.response?.data || error.message,
    );
    throw new Error(
      `No se pudo enviar el mensaje por WhatsApp: ${
        error.response?.data?.error?.message || error.message
      }`,
    );
  }
}
