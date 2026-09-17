import OpenAI from "openai";
import {
  appointmentToolDefinitions,
  getAvailableSlots,
  bookAppointment,
} from "./appointments";

export interface ToolContext {
  tenantId: string;
  userPhone: string;
  tenantConfig: Record<string, any>;
}

export type ToolHandler = (args: any, ctx: ToolContext) => Promise<string>;

interface RegisteredTool {
  definition: OpenAI.ChatCompletionTool;
  handler: ToolHandler;
}

// Registro global de herramientas disponibles en el sistema
const toolRegistry: Record<string, RegisteredTool> = {};

// Función auxiliar para registrar herramientas
export function registerTool(
  definition: OpenAI.ChatCompletionTool,
  handler: ToolHandler,
): void {
  if (definition.type === "function") {
    const name = definition.function.name;
    toolRegistry[name] = { definition, handler };
  }
}

// Registrar herramientas del módulo de turnos
const [getSlotsDef, bookAppDef] = appointmentToolDefinitions;
registerTool(getSlotsDef, (args, ctx) => getAvailableSlots(args, ctx));
registerTool(bookAppDef, (args, ctx) => bookAppointment(args, ctx));

/**
 * Obtiene las definiciones de OpenAI Tools habilitadas para un tenant específico
 */
export function getToolsForTenant(
  activeTools: string[] | null | undefined,
): OpenAI.ChatCompletionTool[] {
  if (!activeTools || !Array.isArray(activeTools)) {
    // Si no tiene herramientas configuradas, retornar las herramientas por defecto del registro
    return Object.values(toolRegistry).map((t) => t.definition);
  }

  return activeTools
    .map((toolName) => toolRegistry[toolName]?.definition)
    .filter((def): def is OpenAI.ChatCompletionTool => Boolean(def));
}

/**
 * Despacha y ejecuta la herramienta solicitada por el LLM dentro del contexto del tenant
 */
export async function executeTool(
  toolName: string,
  rawArgs: string,
  ctx: ToolContext,
): Promise<string> {
  const tool = toolRegistry[toolName];
  if (!tool) {
    return JSON.stringify({
      error: `La herramienta '${toolName}' no está soportada o no está habilitada.`,
    });
  }

  try {
    const parsedArgs = rawArgs ? JSON.parse(rawArgs) : {};
    return await tool.handler(parsedArgs, ctx);
  } catch (error: any) {
    console.error(`[Tool Execution Error - ${toolName}]:`, error);
    return JSON.stringify({
      error: `Error al procesar los argumentos de '${toolName}'.`,
      details: error.message,
    });
  }
}
