import dotenv from "dotenv";

dotenv.config();

export interface Config {
  port: number;
  databaseUrl: string;
  openaiApiKey: string;
  metaVerifyToken: string;
  metaGraphApiVersion: string;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    console.warn(`[Config Warning] La variable de entorno ${key} no está definida.`);
    return "";
  }
  return value;
}

export const config: Config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: getEnv("DATABASE_URL", "postgresql://usuario:password@localhost:5432/whatsapp_bot_db"),
  openaiApiKey: getEnv("OPENAI_API_KEY"),
  metaVerifyToken: getEnv("META_VERIFY_TOKEN", "webhook_token_secreto"),
  metaGraphApiVersion: getEnv("META_GRAPH_API_VERSION", "v19.0"),
};
