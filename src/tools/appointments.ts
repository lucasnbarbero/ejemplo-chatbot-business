import OpenAI from "openai";
import { pool } from "../database";
import { ToolContext } from "./index";

export interface GetAvailableSlotsArgs {
  date: string; // Formato YYYY-MM-DD
}

export interface BookAppointmentArgs {
  client_name: string;
  service_name: string;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:MM
}

export const appointmentToolDefinitions: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_available_slots",
      description: "Consulta los horarios libres disponibles para agendar un turno en una fecha determinada (YYYY-MM-DD).",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Fecha a consultar en formato estricto YYYY-MM-DD (ej: 2026-09-20)",
          },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Agenda y confirma un turno para el cliente en una fecha y hora específica.",
      parameters: {
        type: "object",
        properties: {
          client_name: {
            type: "string",
            description: "Nombre y apellido completo del cliente",
          },
          service_name: {
            type: "string",
            description: "Nombre o descripción del servicio solicitado (ej: Corte de cabello, Consulta médica, etc.)",
          },
          date: {
            type: "string",
            description: "Fecha del turno en formato YYYY-MM-DD",
          },
          time: {
            type: "string",
            description: "Hora del turno en formato HH:MM (formato 24 horas, ej: 14:00)",
          },
        },
        required: ["client_name", "service_name", "date", "time"],
      },
    },
  },
];

export async function getAvailableSlots(
  args: GetAvailableSlotsArgs,
  ctx: ToolContext,
): Promise<string> {
  try {
    if (!args.date || !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      return JSON.stringify({
        error: "Formato de fecha inválido. Debe ser YYYY-MM-DD.",
      });
    }

    const businessStart = ctx.tenantConfig.business_start || "09:00";
    const businessEnd = ctx.tenantConfig.business_end || "18:00";
    const slotMinutes = Number(ctx.tenantConfig.slot_duration_minutes) || 60;

    const startDay = `${args.date} 00:00:00+00`;
    const endDay = `${args.date} 23:59:59+00`;

    // Consultar turnos confirmados para esa fecha
    const existing = await pool.query(
      `SELECT start_time FROM appointments 
       WHERE tenant_id = $1 AND status = 'confirmed' 
       AND start_time BETWEEN $2 AND $3`,
      [ctx.tenantId, startDay, endDay],
    );

    const bookedHours = new Set(
      existing.rows.map((row) => {
        const d = new Date(row.start_time);
        const hours = d.getUTCHours().toString().padStart(2, "0");
        const minutes = d.getUTCMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      }),
    );

    // Generar slots posibles dentro del rango laboral
    const slots: string[] = [];
    const [startHour, startMin] = businessStart.split(":").map(Number);
    const [endHour, endMin] = businessEnd.split(":").map(Number);

    let currentMinutes = startHour * 60 + (startMin || 0);
    const totalEndMinutes = endHour * 60 + (endMin || 0);

    while (currentMinutes + slotMinutes <= totalEndMinutes) {
      const h = Math.floor(currentMinutes / 60)
        .toString()
        .padStart(2, "0");
      const m = (currentMinutes % 60).toString().padStart(2, "0");
      const timeSlot = `${h}:${m}`;

      if (!bookedHours.has(timeSlot)) {
        slots.push(timeSlot);
      }
      currentMinutes += slotMinutes;
    }

    return JSON.stringify({
      date: args.date,
      available_slots: slots,
      message:
        slots.length > 0
          ? `Hay ${slots.length} turnos disponibles para el ${args.date}.`
          : `No hay turnos disponibles para el ${args.date}.`,
    });
  } catch (error: any) {
    console.error("[getAvailableSlots Error]:", error);
    return JSON.stringify({
      error: "Error al consultar la disponibilidad de turnos.",
      details: error.message,
    });
  }
}

export async function bookAppointment(
  args: BookAppointmentArgs,
  ctx: ToolContext,
): Promise<string> {
  try {
    if (!args.date || !args.time || !args.client_name || !args.service_name) {
      return JSON.stringify({
        success: false,
        message: "Faltan parámetros requeridos para agendar el turno.",
      });
    }

    const startTime = `${args.date}T${args.time}:00Z`;
    const slotDuration = Number(ctx.tenantConfig.slot_duration_minutes) || 60;
    const startMs = new Date(startTime).getTime();

    if (isNaN(startMs)) {
      return JSON.stringify({
        success: false,
        message: "Fecha u hora inválida.",
      });
    }

    const endTime = new Date(startMs + slotDuration * 60000).toISOString();

    // Validar solapamiento con turnos confirmados
    const conflict = await pool.query(
      `SELECT id FROM appointments 
       WHERE tenant_id = $1 AND status = 'confirmed' 
       AND start_time = $2`,
      [ctx.tenantId, startTime],
    );

    if (conflict.rowCount && conflict.rowCount > 0) {
      return JSON.stringify({
        success: false,
        message: "El horario seleccionado ya se encuentra reservado por otro cliente.",
      });
    }

    // Insertar turno
    const res = await pool.query(
      `INSERT INTO appointments (
         tenant_id, client_phone, client_name, service_name, start_time, end_time, status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') 
       RETURNING id, client_name, service_name, start_time, end_time, status`,
      [
        ctx.tenantId,
        ctx.userPhone,
        args.client_name,
        args.service_name,
        startTime,
        endTime,
      ],
    );

    return JSON.stringify({
      success: true,
      message: "Turno agendado y confirmado exitosamente.",
      appointment: res.rows[0],
    });
  } catch (error: any) {
    console.error("[bookAppointment Error]:", error);
    return JSON.stringify({
      success: false,
      error: "Error interno al procesar la reserva del turno.",
      details: error.message,
    });
  }
}
