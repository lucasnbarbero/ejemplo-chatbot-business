import { Request, Response } from "express";
import { config } from "../config/env";
import { pool } from "../database";
import { processUserMessage } from "../services/agent";
import { sendWhatsAppMessage } from "../services/whatsapp";

/**
 * Endpoint GET /webhook para la verificación inicial de Meta Webhooks
 */
export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.metaVerifyToken) {
    console.log("[Webhook] Verificación de handshake con Meta exitosa.");
    res.status(200).send(challenge);
    return;
  }

  console.warn("[Webhook] Intento de verificación fallido. Token inválido.");
  res.sendStatus(403);
}

/**
 * Endpoint POST /webhook para la recepción unificada de eventos de WhatsApp
 */
export async function receiveWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  // Confirmar recepción inmediatamente con 200 OK a Meta para evitar reintentos y timeouts
  res.status(200).send("EVENT_RECEIVED");

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    // Ignorar si el payload no contiene mensajes (ej: recibos de entrega o lectura de estado)
    if (!change?.messages || change.messages.length === 0) {
      return;
    }

    const messageData = change.messages[0];
    const phoneNumberId = change.metadata?.phone_number_id;
    const userPhone = messageData.from;

    if (!phoneNumberId || !userPhone) {
      console.warn("[Webhook] Payload incompleto: falta phoneNumberId o userPhone.");
      return;
    }

    // 1. Buscar Tenant en la base de datos por el phone_number_id receptor
    const tenantRes = await pool.query(
      `SELECT id, name, whatsapp_token, system_prompt, active_tools, config 
       FROM tenants 
       WHERE phone_number_id = $1`,
      [phoneNumberId],
    );

    if (tenantRes.rowCount === 0) {
      console.warn(
        `[Webhook] Tenant no registrado para phone_number_id: ${phoneNumberId}`,
      );
      return;
    }

    const tenant = tenantRes.rows[0];

    // 2. Mapeo de fallbacks para tipos de mensaje no soportados
    if (messageData.type !== "text") {
      console.log(
        `[Webhook] Mensaje de tipo no soportado ('${messageData.type}') recibido de ${userPhone}`,
      );
      await sendWhatsAppMessage({
        phoneNumberId,
        whatsappToken: tenant.whatsapp_token,
        to: userPhone,
        text: "Por el momento solo puedo procesar mensajes de texto. ¿En qué te puedo ayudar?",
      });
      return;
    }

    const incomingText = messageData.text?.body;
    if (!incomingText) return;

    // 3. Procesar el mensaje con el motor de Inteligencia Artificial
    const replyText = await processUserMessage(tenant, userPhone, incomingText);

    // 4. Enviar la respuesta a WhatsApp utilizando las credenciales del Tenant
    await sendWhatsAppMessage({
      phoneNumberId,
      whatsappToken: tenant.whatsapp_token,
      to: userPhone,
      text: replyText,
    });
  } catch (error: any) {
    console.error("[Webhook Processing Error]:", error);
  }
}
