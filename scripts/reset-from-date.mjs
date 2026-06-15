#!/usr/bin/env node
/**
 * Reinicia histórico a partir de uma data e define saldo inicial em conta.
 *
 *   npm run reset:from-date -- --date 2026-06-14 --balance 10668.46
 *   npm run reset:from-date -- --date 2026-06-14 --balance 10668.46 --email demo@finapp.com
 *   npm run reset:from-date -- --date 2026-06-14 --before-only   # só apaga anteriores, mantém resto
 */
import 'dotenv/config';
import { runMigrations } from '../server/db/pool.js';
import { DEMO_EMAIL } from '../server/db/seedUser.js';
import { resetFromDate, findUserIdByEmail } from '../server/utils/resetFromDate.js';

function parseArgs(argv) {
  const opts = {
    date: null,
    balance: null,
    email: DEMO_EMAIL,
    accountId: 'pf-cc',
    wipeAll: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--date' || a === '-d') opts.date = argv[++i];
    else if (a === '--balance' || a === '-b') opts.balance = Number(argv[++i]);
    else if (a === '--email' || a === '-e') opts.email = argv[++i];
    else if (a === '--account' || a === '-a') opts.accountId = argv[++i];
    else if (a === '--before-only') opts.wipeAll = false;
    else if (a === '--help' || a === '-h') opts.help = true;
  }

  return opts;
}

function usage() {
  console.log(`
Uso:
  npm run reset:from-date -- --date AAAA-MM-DD --balance VALOR [opções]

Opções:
  --date, -d       Data de corte (ex.: 2026-06-14)
  --balance, -b    Saldo inicial da conta (ex.: 10668.46)
  --email, -e      E-mail do usuário (padrão: ${DEMO_EMAIL})
  --account, -a    ID da conta (padrão: pf-cc)
  --before-only    Apaga só lançamentos anteriores à data (mantém os demais)
  --help, -h       Mostra esta ajuda
`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.date) {
    usage();
    process.exit(opts.help ? 0 : 1);
  }

  const hasDb = await runMigrations();
  if (!hasDb) {
    console.error('[reset] Defina DATABASE_URL no .env');
    process.exit(1);
  }

  const userId = await findUserIdByEmail(opts.email);
  if (!userId) {
    console.error(`[reset] Usuário não encontrado: ${opts.email}`);
    process.exit(1);
  }

  const result = await resetFromDate(userId, {
    cutoffDate: opts.date,
    balance: opts.balance,
    accountId: opts.accountId,
    wipeAll: opts.wipeAll,
  });

  console.log('[reset] Concluído');
  console.log(`  Usuário:     ${opts.email}`);
  console.log(`  Data corte:  ${result.cutoffDate}`);
  console.log(`  Removidos:   ${result.deleted} lançamento(s)`);
  if (result.balance != null) {
    console.log(`  Conta:       ${opts.accountId} → R$ ${result.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`  PF disp.:    R$ ${Number(result.pfAvailable || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
