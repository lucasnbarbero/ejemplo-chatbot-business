import OpenAI from "openai";
import { pool } from "../database";
import { config } from "../config/env";
import { getToolsForTenant, executeTool, ToolContext } from "../tools";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export interface TenantData {
  id: string;
  name: string;
  system_prompt: string;
  active_tools?: string[];
  config?: Record<string, any>;
}

/**
 * Orquestador principal del Agente IA:
 * - Gestiona la sesión y memoria en PostgreSQL
 * - Inyecta contexto dinámico y reglas del Tenant
 * - Ejecuta el ciclo de Tool Calling desacoplado
 */
export async function processUserMessage(
  tenant: TenantData,
  userPhone: string,
  userText: string,
): Promise<string> {
  // 1. Obtener o crear conversación única por (tenant_id, user_phone)
  let convRes = await pool.query(
    `SELECT id FROM conversations WHERE tenant_id = $1 AND user_phone = $2`,
    [tenant.id, userPhone],
  );

  let conversationId: string;
  if (convRes.rowCount === 0) {
    const newConv = await pool.query(
      `INSERT INTO conversations (tenant_id, user_phone) 
       VALUES ($1, $2) 
       RETURNING id`,
      [tenant.id, userPhone],
    );
    conversationId = newConv.rows[0].id;
  } else {
    conversationId = convRes.rows[0].id;
    // Actualizar updated_at
    await pool.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );
  }

  // 2. Persistir mensaje entrante del usuario
  await pool.query(
    `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2)`,
    [conversationId, userText],
  );

  // 3. Recuperar últimos 10 mensajes del historial
  const historyRes = await pool.query(
    `SELECT role, content, tool_call_id FROM messages 
     WHERE conversation_id = $1 
     ORDER BY created_at DESC LIMIT 10`,
    [conversationId],
  );

  // Reordenar cronológicamente (de más antiguo a más reciente)
  const historyMessages = historyRes.rows.reverse().map((r) => ({
    role: r.role as "user" | "assistant" | "system",
    content: r.content || "",
  }));

  // Preparar prompt de sistema enriquecido con fecha/hora actual
  const now = new Date();
  const currentDateTimeIso = now.toISOString();
  const currentFormatted = now.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "full",
    timeStyle: "short",
  });

  const enrichedSystemPrompt = `${tenant.system_prompt.trim()}

[Información contextual del sistema]
- Fecha y hora actual del servidor: ${currentDateTimeIso} (${currentFormatted})
- Nombre del negocio / empresa: ${tenant.name}
- Teléfono del cliente: ${userPhone}`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: enrichedSystemPrompt },
    ...historyMessages,
  ];

  // 4. Obtener herramientas habilitadas para este tenant
  const tenantTools = getToolsForTenant(tenant.active_tools);

  const toolCtx: ToolContext = {
    tenantId: tenant.id,
    userPhone,
    tenantConfig: tenant.config || {},
  };

  try {
    // 5. Invocación inicial a OpenAI
    const initialCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: tenantTools.length > 0 ? tenantTools : undefined,
      tool_choice: tenantTools.length > 0 ? "auto" : undefined,
    });

    let assistantMessage = initialCompletion.choices[0].message;

    // 6. Ciclo de resolución de Tool Calling
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type === "function") {
          const functionName = toolCall.function.name;
          const functionArgs = toolCall.function.arguments;

          const toolResult = await executeTool(
            functionName,
            functionArgs,
            toolCtx,
          );

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }
      }

      // Segunda llamada al modelo para generar la respuesta en lenguaje natural con los resultados de las herramientas
      const followUpCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      });

      assistantMessage = followUpCompletion.choices[0].message;
    }

    const replyText =
      assistantMessage.content ||
      "Disculpá, en este momento no pude procesar tu solicitud. ¿Podrías intentar nuevamente?";

    // 7. Persistir respuesta del asistente
    await pool.query(
      `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)`,
      [conversationId, replyText],
    );

    return replyText;
  } catch (error: any) {
    console.error("[Agent Process Error]:", error);
    const fallbackText =
      "Ocurrió un error temporal al procesar tu mensaje. Por favor, intentá de nuevo en unos momentos.";

    await pool.query(
      `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)`,
      [conversationId, fallbackText],
    );

    return fallbackText;
  }
}
