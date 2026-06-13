#!/usr/bin/env node
/**
 * Carrega snapshot + lançamentos da planilha (src/data.js) no Postgres.
 *
 *   npm run seed:spreadsheet          — só usuários sem carga inicial
 *   npm run seed:spreadsheet -- --force — reaplica para todos (apaga lançamentos atuais)
 */
import 'dotenv/config';
import { runMigrations, query } from '../server/db/pool.js';
import { ensureAllSpreadsheetsLoaded, reapplySpreadsheetSeed } from '../server/utils/spreadsheetSeed.js';

const force = process.argv.includes('--force');

async function main() {
  const hasDb = await runMigrations();
  if (!hasDb) {
    console.error('[seed] Defina DATABASE_URL no .env');
    process.exit(1);
  }

  if (force) {
    const { rows } = await query('SELECT id, email FROM users');
    for (const { id, email } of rows) {
      const n = await reapplySpreadsheetSeed(id);
      console.log(`[seed] ${email}: ${n} lançamentos (Jun/26)`);
    }
  } else {
    await ensureAllSpreadsheetsLoaded();
  }

  console.log('[seed] Concluído');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
