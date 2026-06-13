/** Tokens definidos em global.css (:root / html.dark) */
export const c = {
  bgApp: 'var(--bg-app)',
  bgCard: 'var(--bg-card)',
  bgElevated: 'var(--bg-elevated)',
  bgSubtle: 'var(--bg-subtle)',
  bgInput: 'var(--bg-input)',
  bgToggle: 'var(--bg-toggle)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  border: 'var(--border)',
  divider: 'var(--divider)',
  navBg: 'var(--nav-bg)',
  shadowCard: 'var(--shadow-card)',
  chartGrid: 'var(--chart-grid)',
  chartLabel: 'var(--chart-label)',
};

export function applyThemeClass(dark) {
  document.documentElement.classList.toggle('dark', !!dark);
}
