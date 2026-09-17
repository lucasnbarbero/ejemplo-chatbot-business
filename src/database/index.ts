import { Pool } from "pg";
import { config } from "../config/env";

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on("error", (err) => {
  console.error("[PostgreSQL Pool Error]:", err);
});
