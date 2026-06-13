export function independenceGoal(goals = []) {
  const g = goals.find((x) => /independ/i.test(x.name)) || goals[0];
  const target = g?.target ?? 3000000;
  const year = g?.year ?? 2029;
  return {
    target,
    year,
    current: g?.current ?? 0,
    shortLabel: formatGoalShort(target),
  };
}

export function formatGoalShort(value) {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `R$${Number.isInteger(m) ? m : m.toFixed(1).replace('.0', '')}M`;
  }
  if (value >= 1_000) return `R$${Math.round(value / 1000)}k`;
  return `R$${value}`;
}
