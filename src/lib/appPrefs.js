const TAB_KEY = 'fin_active_tab';
const VALID_TABS = ['dashboard', 'movimentos', 'planejamento', 'patrimonio', 'mais'];

export function loadActiveTab() {
  const saved = localStorage.getItem(TAB_KEY);
  return VALID_TABS.includes(saved) ? saved : 'dashboard';
}

export function saveActiveTab(tab) {
  if (VALID_TABS.includes(tab)) localStorage.setItem(TAB_KEY, tab);
}
