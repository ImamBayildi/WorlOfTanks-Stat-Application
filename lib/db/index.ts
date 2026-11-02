import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pgPool?: Pool }

// pg treats prefer/require/verify-ca as verify-full and warns about it; make that explicit.
function withExplicitSslMode(url: string | undefined) {
  return url?.replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/, "$1verify-full")
}

export const pool =
  globalForDb.pgPool ?? new Pool({ connectionString: withExplicitSslMode(process.env.DATABASE_URL), max: 5 })
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool

export const db = drizzle(pool, { schema })
