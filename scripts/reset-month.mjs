#!/usr/bin/env node
/**
 * Reinicia a conta no mês atual: apaga lançamentos de outros meses e recria os deste mês.
 *
 *   npm run reset:month
 *   FORCE_RESET_MONTH=true npm run reset:month
 */
import 'dotenv/config';
import { runMigrations } from '../server/db/pool.js';
import { ensureAccountMonthBaseline } from '../server/utils/resetCurrentMonth.js';

process.env.FORCE_RESET_MONTH = 'true';

async function main() {
  const hasDb = await runMigrations();
  if (!hasDb) {
    console.error('[reset] Defina DATABASE_URL no .env');
    process.exit(1);
  }
  await ensureAccountMonthBaseline();
  console.log('[reset] Concluído');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
