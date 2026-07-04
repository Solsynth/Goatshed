import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "~~/server/db/index";

const dbUrl = process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString: dbUrl });
const instance = drizzle(pool, { schema });

let initPromise: Promise<void> | null = null;

function ensureSchema() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await pool.query(`
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nick" text;
      `);
      console.log("[db] Schema ensured");
    } catch (err: unknown) {
      console.error("[db] Schema init failed:", (err as Error)?.message || err);
    }
  })();
  return initPromise;
}

ensureSchema();

export const db = instance;
