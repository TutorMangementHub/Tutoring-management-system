import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import { logger } from "../common/utils/logger.js";
import * as schema from "./schema.js";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  logger.error({ err: error }, "Unexpected PostgreSQL pool error");
});

export const db = drizzle(pool, { schema });

export async function checkDatabase(): Promise<void> {
  await pool.query("select 1");
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
