const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function buildPlanningChart36(MB = [], targetCount = 36) {
  if (!MB.length) return [];

  const points = MB.map((r) => ({ label: r.m, value: r.pjSaldo + r.pfSaldo }));
  if (points.length >= targetCount) return points.slice(0, targetCount);

  const last = MB[MB.length - 1];
  const lastVal = last.pjSaldo + last.pfSaldo;
  const [lastMon, lastYrStr] = last.m.split('/');
  let mi = MONTH_LABELS.indexOf(lastMon);
  let yr = parseInt(lastYrStr, 10);

  while (points.length < targetCount) {
    mi += 1;
    if (mi >= 12) {
      mi = 0;
      yr += 1;
    }
    points.push({
      label: `${MONTH_LABELS[mi]}/${String(yr).padStart(2, '0')}`,
      value: lastVal,
    });
  }

  return points;
}
