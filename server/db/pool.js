import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool = null;

export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on('error', (err) => console.error('[db] Erro no pool:', err.message));
  }
  return pool;
}

export async function runMigrations() {
  const p = getPool();
  if (!p) {
    console.warn('[db] DATABASE_URL não definida — usando armazenamento em memória');
    return false;
  }
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await p.query(schema);
  console.log('[db] Migrations aplicadas');
  return true;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error('Database not configured');
  return p.query(text, params);
}
