import { fmt } from '../data.js';

function csvEscape(value) {
  const s = String(value ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function downloadText(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMonthlyReportCsv({
  monthRaw,
  planInc,
  planExp,
  planSaldo,
  actInc,
  actExp,
  kpis = [],
  catList = [],
  confirmed = [],
}) {
  const stamp = new Date().toISOString().slice(0, 10);
  const lines = [
    'Relatório Mensal FinApp',
    `Mês,${csvEscape(monthRaw)}`,
    `Gerado em,${stamp}`,
    '',
    'Resumo,Valor',
    `Receita planejada,${planInc}`,
    `Despesa planejada,${planExp}`,
    `Saldo projetado,${planSaldo}`,
    `Receita confirmada,${actInc}`,
    `Despesa confirmada,${actExp}`,
    '',
    'KPI,Valor',
    ...kpis.map((k) => `${csvEscape(k.label)},${k.value}`),
    '',
    'Categoria,Valor,Percentual',
    ...catList.map(([cat, val, pct]) => `${csvEscape(cat)},${val},${pct}%`),
    '',
    'Lançamentos confirmados,Valor,Tipo',
    ...confirmed.map((tx) => `${csvEscape(tx.desc)},${tx.value},${tx.type}`),
  ];

  const safeMonth = monthRaw.replace(/\//g, '-');
  downloadText(`finapp-relatorio-${safeMonth}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
}

export function formatReportSummary({ monthRaw, planSaldo, actInc, actExp }) {
  return `${monthRaw}: saldo projetado ${fmt(planSaldo, { short: true })} · confirmado ${fmt(actInc - actExp, { short: true })}`;
}
