// Shared Postgres pool (underscore-prefixed files are NOT exposed as routes by Vercel).
import pg from 'pg';
const { Pool } = pg;
let pool;
export function db() {
  if (!pool) {
    const cs = process.env.DATABASE_URL || '';
    pool = new Pool({
      connectionString: cs,
      // managed Postgres (Supabase/Render/Neon) needs SSL; localhost does not
      ssl: cs.includes('localhost') || cs.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10000
    });
  }
  return pool;
}
export async function q(text, params) {
  const r = await db().query(text, params);
  return r.rows;
}
