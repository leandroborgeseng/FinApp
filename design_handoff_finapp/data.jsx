// data.jsx — dados reais do orçamento 2026-2028

const MB = [ // monthlyBudget: 31 meses Jun/26→Dez/28 (fonte: planilha Orçamento2026-2028)
  { m:'Jun/26', pjInc:61901,  pjSaldo:35147, aplicPJ:1147,  pfInc:41350, pfSaldo:11301, aplicPF:11301, repasse:34000, cdb:12573,    cdbRet:126    },
  { m:'Jul/26', pjInc:82068,  pjSaldo:58618, aplicPJ:18618, pfInc:53800, pfSaldo:30046, aplicPF:30046, repasse:40000, cdb:61850,    cdbRet:619    },
  { m:'Ago/26', pjInc:89693,  pjSaldo:69595, aplicPJ:29595, pfInc:49650, pfSaldo:26697, aplicPF:26697, repasse:40000, cdb:119323,   cdbRet:1193   },
  { m:'Set/26', pjInc:85693,  pjSaldo:65935, aplicPJ:40935, pfInc:34650, pfSaldo:14938, aplicPF:14938, repasse:25000, cdb:176947,   cdbRet:1769   },
  { m:'Out/26', pjInc:80026,  pjSaldo:65190, aplicPJ:40190, pfInc:34650, pfSaldo:17938, aplicPF:17938, repasse:25000, cdb:237426,   cdbRet:2374   },
  { m:'Nov/26', pjInc:80026,  pjSaldo:65190, aplicPJ:40190, pfInc:34650, pfSaldo:17938, aplicPF:17938, repasse:25000, cdb:298508,   cdbRet:2985   },
  { m:'Dez/26', pjInc:80026,  pjSaldo:65190, aplicPJ:40190, pfInc:34650, pfSaldo:18120, aplicPF:18120, repasse:25000, cdb:360386,   cdbRet:3604   },
  { m:'Jan/27', pjInc:78905,  pjSaldo:66714, aplicPJ:41714, pfInc:33700, pfSaldo:18270, aplicPF:18270, repasse:25000, cdb:420970,   cdbRet:4210   },
  { m:'Fev/27', pjInc:78905,  pjSaldo:66714, aplicPJ:41714, pfInc:33700, pfSaldo:19907, aplicPF:19907, repasse:25000, cdb:487417,   cdbRet:4874   },
  { m:'Mar/27', pjInc:78905,  pjSaldo:66714, aplicPJ:41714, pfInc:33700, pfSaldo:20807, aplicPF:20807, repasse:25000, cdb:555437,   cdbRet:5554   },
  { m:'Abr/27', pjInc:95780,  pjSaldo:82155, aplicPJ:57155, pfInc:33700, pfSaldo:20807, aplicPF:20807, repasse:25000, cdb:639733,   cdbRet:6397   },
  { m:'Mai/27', pjInc:95780,  pjSaldo:82155, aplicPJ:57155, pfInc:33700, pfSaldo:20807, aplicPF:20807, repasse:25000, cdb:724871,   cdbRet:7249   },
  { m:'Jun/27', pjInc:95780,  pjSaldo:82155, aplicPJ:57155, pfInc:33700, pfSaldo:20795, aplicPF:20795, repasse:25000, cdb:810849,   cdbRet:8108   },
  { m:'Jul/27', pjInc:105947, pjSaldo:91457, aplicPJ:66457, pfInc:33700, pfSaldo:20795, aplicPF:20795, repasse:25000, cdb:907083,   cdbRet:9071   },
  { m:'Ago/27', pjInc:105447, pjSaldo:91000, aplicPJ:66000, pfInc:33700, pfSaldo:20795, aplicPF:20795, repasse:25000, cdb:1003816,  cdbRet:10038  },
  { m:'Set/27', pjInc:101447, pjSaldo:87340, aplicPJ:62340, pfInc:33700, pfSaldo:20795, aplicPF:20795, repasse:25000, cdb:1097821,  cdbRet:10978  },
  { m:'Out/27', pjInc:95780,  pjSaldo:82155, aplicPJ:57155, pfInc:33700, pfSaldo:20795, aplicPF:20795, repasse:25000, cdb:1187528,  cdbRet:11875  },
  { m:'Nov/27', pjInc:95780,  pjSaldo:82155, aplicPJ:57155, pfInc:33700, pfSaldo:20795, aplicPF:20795, repasse:25000, cdb:1278133,  cdbRet:12781  },
  { m:'Dez/27', pjInc:95780,  pjSaldo:82155, aplicPJ:57155, pfInc:33700, pfSaldo:20795, aplicPF:20795, repasse:25000, cdb:1369644,  cdbRet:13696  },
  { m:'Jan/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:1444496,  cdbRet:14445  },
  { m:'Fev/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:1507178,  cdbRet:15072  },
  { m:'Mar/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:1570488,  cdbRet:15705  },
  { m:'Abr/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:1634430,  cdbRet:16344  },
  { m:'Mai/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:1699012,  cdbRet:16990  },
  { m:'Jun/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:1764240,  cdbRet:17642  },
  { m:'Jul/28', pjInc:71750,  pjSaldo:60167, aplicPJ:35167, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:1839515,  cdbRet:18395  },
  { m:'Ago/28', pjInc:71250,  pjSaldo:59710, aplicPJ:34710, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:1915081,  cdbRet:19151  },
  { m:'Set/28', pjInc:67250,  pjSaldo:56050, aplicPJ:31050, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:3913732,  cdbRet:39137  },
  { m:'Out/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:4001107,  cdbRet:40011  },
  { m:'Nov/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:4089355,  cdbRet:40894  },
  { m:'Dez/28', pjInc:61583,  pjSaldo:50865, aplicPJ:25865, pfInc:33700, pfSaldo:21895, aplicPF:21895, repasse:25000, cdb:4089355,  cdbRet:40894  },
];

const AppData = {
  // ── Patrimônio ──────────────────────────────────────
  netWorth:       1250000,
  pfAvailable:    85000,
  pjAvailable:    320000,
  pfInvestments:  410000,
  pjInvestments:  280000,
  debts:          170000,
  monthResult:    35147 + 11301,   // jun/26 PJ + PF saldo
  nextMonthForecast: 58618 + 30046, // jul/26

  // ── Histórico patrimônio ────────────────────────────
  netWorthHistory: [
    { year: 2022, value: 280000 }, { year: 2023, value: 520000 },
    { year: 2024, value: 820000 }, { year: 2025, value: 1080000 },
    { year: 2026, value: 1250000 },
  ],

  // ── Fluxo de caixa 12 meses (Jul/26 → Jun/27) ──────
  cashFlow: MB.slice(1, 13).map(r => ({
    label: r.m.slice(0, 3),
    income:  r.pjInc + 8300 + 1500,          // PJ + FACEF + Aluguel
    expense: r.pjInc - r.pjSaldo + r.pfInc - r.pfSaldo,
  })),

  // ── Projeção CDB (fonte planilha — 1%/mês) ─────────
  cdbProjection: MB.map(r => ({ label: r.m, value: r.cdb, aplic: r.aplicPJ + r.aplicPF, ret: r.cdbRet })),

  // ── Projeção patrimonial 2026→2040 ─────────────────
  wealthForecast: [
    { year: 2026, value: 1250000  },
    { year: 2027, value: 1370000 + 360386  },  // CDB + patrimônio atual
    { year: 2028, value: 1370000 + 1369644 },
    { year: 2029, value: 1370000 + 4089355 },
    { year: 2030, value: 7500000  },
    { year: 2032, value: 9200000  },
    { year: 2035, value: 12000000 },
    { year: 2040, value: 18000000 },
  ],

  // ── Lançamentos recorrentes do mês ─────────────────
  // PJ — dias estimados de recebimento/pagamento
  monthlyEvents: [
    { desc: 'FIPEC',            type: 'income',   value: 33440, day: 20, entity: 'PJ', cat: 'Receita PJ'     },
    { desc: 'UNIMED HSJ',       type: 'income',   value: 26086, day: 15, entity: 'PJ', cat: 'Receita PJ'     },
    { desc: 'Microblau',        type: 'income',   value: 2375,  day: 20, entity: 'PJ', cat: 'Receita PJ'     },
    { desc: 'Impostos PJ',      type: 'expense',  value: 15000, day: 25, entity: 'PJ', cat: 'Impostos'       },
    { desc: 'Empréstimo PJ',    type: 'expense',  value: 2000,  day: 10, entity: 'PJ', cat: 'Financiamento'  },
    { desc: 'Salários',         type: 'expense',  value: 1000,  day: 5,  entity: 'PJ', cat: 'Salários'       },
    { desc: 'Software',         type: 'expense',  value: 275,   day: 5,  entity: 'PJ', cat: 'Software'       },
    { desc: 'Contabilidade',    type: 'expense',  value: 480,   day: 10, entity: 'PJ', cat: 'Contabilidade'  },
    { desc: 'Treinamento',      type: 'expense',  value: 7300,  day: 10, entity: 'PJ', cat: 'Treinamento'    },
    { desc: 'Condomínio',       type: 'expense',  value: 550,   day: 5,  entity: 'PJ', cat: 'Condomínio'     },
    { desc: 'Apartamento',      type: 'expense',  value: 149,   day: 5,  entity: 'PJ', cat: 'Outros'         },
    // PF
    { desc: 'FACEF',            type: 'income',   value: 6000,  day: 30, entity: 'PF', cat: 'Salário'        },
    { desc: 'Aluguel recebido', type: 'income',   value: 1500,  day: 10, entity: 'PF', cat: 'Aluguel'        },
    { desc: 'Consignado',       type: 'expense',  value: 1100,  day: 5,  entity: 'PF', cat: 'Financiamento'  },
    { desc: 'Financiamento Sala',type:'expense',  value: 2897,  day: 8,  entity: 'PF', cat: 'Financiamento'  },
    { desc: 'Financiamento PF', type: 'expense',  value: 1637,  day: 8,  entity: 'PF', cat: 'Financiamento'  },
    { desc: 'Mariah — Escola',  type: 'expense',  value: 2000,  day: 5,  entity: 'PF', cat: 'Educação'       },
    { desc: 'Lívia — Psicóloga',type: 'expense',  value: 2200,  day: 15, entity: 'PF', cat: 'Saúde'          },
    { desc: 'Lívia — Personal', type: 'expense',  value: 900,   day: 5,  entity: 'PF', cat: 'Saúde'          },
    { desc: 'Lívia — Tratamento',type:'expense',  value: 2800,  day: 10, entity: 'PF', cat: 'Saúde'          },
    { desc: 'Cartão Master',    type: 'expense',  value: 3390,  day: 12, entity: 'PF', cat: 'Cartão'         },
    { desc: 'Plano saúde/apto', type: 'expense',  value: 907,   day: 5,  entity: 'PF', cat: 'Saúde'          },
    { desc: 'Carro (parcela)',  type: 'expense',  value: 7300,  day: 20, entity: 'PF', cat: 'Veículo'        },
    { desc: 'Despesas diversas',type: 'expense',  value: 6000,  day: 25, entity: 'PF', cat: 'Outros'         },
  ],
  startBalances: { PF: 85000, PJ: 320000, Todos: 405000 },

  // ── Transações recentes ─────────────────────────────
  transactions: [
    { id: 1, type: 'income',   desc: 'UNIMED HSJ',       value: 26086, entity: 'PJ', date: '2026-06-15', done: true,  cat: 'Receita PJ'    },
    { id: 2, type: 'income',   desc: 'FACEF',             value: 6000,  entity: 'PF', date: '2026-06-30', done: false, cat: 'Salário'       },
    { id: 3, type: 'income',   desc: 'Aluguel recebido',  value: 1500,  entity: 'PF', date: '2026-06-10', done: true,  cat: 'Aluguel'       },
    { id: 4, type: 'expense',  desc: 'Mariah — Escola',   value: 2000,  entity: 'PF', date: '2026-06-05', done: true,  cat: 'Educação'      },
    { id: 5, type: 'expense',  desc: 'Financiamento Sala',value: 2897,  entity: 'PF', date: '2026-06-08', done: true,  cat: 'Financiamento' },
    { id: 6, type: 'expense',  desc: 'Impostos PJ',       value: 15000, entity: 'PJ', date: '2026-06-25', done: false, cat: 'Impostos'      },
    { id: 7, type: 'expense',  desc: 'Cartão Master',     value: 3390,  entity: 'PF', date: '2026-06-12', done: true,  cat: 'Cartão'        },
    { id: 8, type: 'transfer', desc: 'Aplicação PJ',      value: 1147,  entity: 'PJ', date: '2026-06-28', done: false, cat: 'Investimento'  },
  ],

  // ── Planejamento mensal (próx. 6 meses reais) ──────
  planning: MB.slice(0, 6).map(r => ({
    month: r.m,
    income:  r.pjInc + (r.pfInc - r.repasse), // PJ + PF própria (ex-repasse)
    expense: (r.pjInc - r.pjSaldo) + (r.pfInc - r.repasse - r.pfSaldo),
    saldo:   r.pjSaldo + r.pfSaldo,
    aplicPJ: r.aplicPJ,
    aplicPF: r.aplicPF,
    repasse: r.repasse,
  })),

  // ── Investimentos ───────────────────────────────────
  investments: {
    pf: [
      { name: 'CDB PF (acumulado)',   value: 180000, ret: 12.68, monthly: 11301 },
      { name: 'Tesouro Direto',       value: 130000, ret: 11.8,  monthly: 0     },
      { name: 'Conta Remunerada',     value: 50000,  ret: 10.5,  monthly: 0     },
      { name: 'Fundos',               value: 50000,  ret: 9.2,   monthly: 0     },
    ],
    pj: [
      { name: 'CDB PJ (acumulado)',   value: 200000, ret: 12.68, monthly: 1147  },
      { name: 'Conta Remunerada PJ',  value: 50000,  ret: 10.2,  monthly: 0     },
      { name: 'Fundos PJ',            value: 30000,  ret: 9.8,   monthly: 0     },
    ],
  },

  // ── Financiamento ───────────────────────────────────
  financing: {
    bank: 'Santander (Sala Comercial)', balance: 118000,
    installment: 2897, endYear: 2032,
    history: [
      { year: 2022, value: 180000 }, { year: 2023, value: 162000 },
      { year: 2024, value: 144000 }, { year: 2025, value: 131000 },
      { year: 2026, value: 118000 }, { year: 2027, value: 104000 },
      { year: 2028, value: 90000  }, { year: 2029, value: 75000  },
      { year: 2030, value: 60000  }, { year: 2031, value: 44000  },
      { year: 2032, value: 28000  },
    ],
  },

  // ── Metas ───────────────────────────────────────────
  goals: [
    { name: 'Independência Financeira', target: 3000000, current: 1250000, year: 2029 },
    { name: 'Expansão da Empresa',      target: 500000,  current: 280000,  year: 2028 },
    { name: 'Compra de Imóvel',         target: 800000,  current: 420000,  year: 2030 },
    { name: 'Reserva de Emergência',    target: 200000,  current: 85000,   year: 2027 },
  ],

  // ── Projeção 36 meses (sobra mensal) ────────────────
  planningChart36: [
    ...MB.map(r => ({ label: r.m, value: r.pjSaldo + r.pfSaldo })),
    { label: 'Jan/29', value: 72760 }, { label: 'Fev/29', value: 72760 },
    { label: 'Mar/29', value: 72760 }, { label: 'Abr/29', value: 72760 },
    { label: 'Mai/29', value: 72760 },
  ],

  // ── Lista completa de financiamentos ───────────────
  financingList: [
    { id: 'santander-sala', bank: 'Santander · Sala Comercial', balance: 118000, installment: 2897, endYear: 2032, entity: 'PF', cet: 9.5,  originalBalance: 180000, cat: 'Imóvel Comercial' },
    { id: 'carro',          bank: 'Financiamento Veículo',      balance: 71000,  installment: 7300, endYear: 2027, entity: 'PF', cet: 13.5, originalBalance: 130000, cat: 'Veículo'          },
    { id: 'fin-pf',         bank: 'Financiamento PF',           balance: 24500,  installment: 1637, endYear: 2027, entity: 'PF', cet: 14.5, originalBalance: 40000,  cat: 'Crédito Pessoal'  },
    { id: 'consignado',     bank: 'Consignado PF',              balance: 14300,  installment: 1100, endYear: 2027, entity: 'PF', cet: 12.0, originalBalance: 22000,  cat: 'Crédito Pessoal'  },
  ],

  monthlyBudget: MB,
};

const fmt = (v, opts = {}) => {
  const abs = Math.abs(v);
  if (opts.short) {
    if (abs >= 1000000) return `R$\u00a0${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000)    return `R$\u00a0${(v / 1000).toFixed(0)}k`;
  }
  return `R$\u00a0${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const fmtDate = (iso) => {
  const [, m, d] = iso.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d} ${months[parseInt(m, 10) - 1]}`;
};

Object.assign(window, { AppData, fmt, fmtDate });
