import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../db/index";

const dbUrl = process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString: dbUrl });
const instance = drizzle(pool, { schema });

if (import.meta.dev) {
  migrate(instance, { migrationsFolder: "drizzle" }).catch(() => {});
}

export const db = instance;
