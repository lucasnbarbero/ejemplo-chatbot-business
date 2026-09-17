import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/env";
import { pool } from "./database";
import { verifyWebhook, receiveWebhook } from "./controllers/webhook";

const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de Webhook de WhatsApp / Meta
app.get("/webhook", verifyWebhook);
app.post("/webhook", receiveWebhook);

// Ruta de diagnóstico de Salud
app.get("/api/health", async (_req: Request, res: Response) => {
  let dbStatus = "disconnected";
  try {
    const result = await pool.query("SELECT NOW()");
    if (result.rowCount && result.rowCount > 0) {
      dbStatus = "connected";
    }
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  res.status(200).json({
    status: "ok",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Ruta raíz informativa
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Multi-Tenant WhatsApp AI Agent Core",
    version: "1.0.0",
    status: "running",
    endpoints: {
      webhook_get: "/webhook",
      webhook_post: "/webhook",
      health: "/api/health",
    },
  });
});

// Manejador de rutas no encontradas (404)
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "Ruta no encontrada en el servidor",
  });
});

// Manejador global de errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Global Error Handler]:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "Ha ocurrido un error inesperado",
  });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor WhatsApp AI activo en puerto: ${PORT}`);
  console.log(`📡 Webhook listo en: http://localhost:${PORT}/webhook`);
  console.log(`🩺 Health check en: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

export default app;
