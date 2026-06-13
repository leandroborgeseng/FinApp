#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'design_handoff_finapp');
const DST = path.join(ROOT, 'src');

const FILE_CONFIG = {
  'data.jsx': {
    dest: 'data.js',
    header: '',
    exports: 'export { AppData, fmt, fmtDate, MB };',
  },
  'charts.jsx': {
    dest: 'components/charts.jsx',
    header: "import React from 'react';\n",
    exports: 'export { SparkLine, BarChart, AreaChart, CashFlowStepChart, DonutChart, fmtShort };',
  },
  'navigation.jsx': {
    dest: 'components/navigation.jsx',
    header: "import React from 'react';\n",
    exports: 'export { BottomNav, FAB, SyncBadge };',
  },
  'ios-frame.jsx': {
    dest: 'components/ios-frame.jsx',
    header: "import React from 'react';\n",
    exports: 'export { IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard };',
  },
  'onboarding.jsx': {
    dest: 'components/onboarding.jsx',
    header: "import React from 'react';\n",
    exports: 'export { OnboardingApp };',
  },
  'modal.jsx': {
    dest: 'components/modal.jsx',
    header: "import React from 'react';\n",
    exports: 'export { NovoLancamentoModal, generateSchedule };',
  },
  'screens-c.jsx': {
    dest: 'screens/screens-c.jsx',
    header: `import React from 'react';
import { AppData } from '../data.js';
import { CashFlowStepChart } from '../components/charts.jsx';
import { fmt } from '../data.js';
`,
    exports: 'export { FluxoView };',
  },
  'screens-a.jsx': {
    dest: 'screens/screens-a.jsx',
    header: `import React from 'react';
import { AppData, fmt, fmtDate } from '../data.js';
import { SparkLine, BarChart, AreaChart, DonutChart } from '../components/charts.jsx';
import { FluxoView } from './screens-c.jsx';
`,
    exports: 'export { DashboardScreen, MovimentosScreen, Card, Tag, FluxoDiarioView };',
  },
  'screens-b.jsx': {
    dest: 'screens/screens-b.jsx',
    header: `import React from 'react';
import { AppData, fmt } from '../data.js';
import { AreaChart, DonutChart } from '../components/charts.jsx';
import { Card } from './screens-a.jsx';
import { OrcadoVsRealizado } from './screens-analise.jsx';
import { SyncBadge } from '../components/navigation.jsx';
`,
    exports: 'export { PlanejamentoScreen, PatrimonioScreen, MaisScreen, FinanciamentosContent };',
  },
  'screens-repasse.jsx': {
    dest: 'screens/screens-repasse.jsx',
    header: `import React from 'react';
import { fmt } from '../data.js';
import { Card } from './screens-a.jsx';
`,
    exports: 'export { RepasseScreen };',
  },
  'screens-gestao.jsx': {
    dest: 'screens/screens-gestao.jsx',
    header: `import React from 'react';
import { AppData, fmt } from '../data.js';
import { AreaChart } from '../components/charts.jsx';
import { Card } from './screens-a.jsx';
`,
    exports: 'export { GestaoScreen };',
  },
  'screens-analise.jsx': {
    dest: 'screens/screens-analise.jsx',
    header: `import React from 'react';
import { AppData, fmt } from '../data.js';
import { AreaChart } from '../components/charts.jsx';
import { Card } from './screens-a.jsx';
`,
    exports: 'export { OrcadoVsRealizado, IndependenciaScreen, TributarioScreen };',
  },
  'screens-extra.jsx': {
    dest: 'screens/screens-extra.jsx',
    header: `import React from 'react';
import { AppData, fmt } from '../data.js';
import { AreaChart } from '../components/charts.jsx';
import { Card } from './screens-a.jsx';
`,
    exports: 'export { ComparativoMesesScreen, CalculadoraRentabilidadeScreen };',
  },
  'screens-tools.jsx': {
    dest: 'screens/screens-tools.jsx',
    header: `import React from 'react';
import { AppData, fmt } from '../data.js';
import { AreaChart, DonutChart } from '../components/charts.jsx';
import { Card } from './screens-a.jsx';
`,
    exports: 'export { SimuladorESeScreen, RelatorioMensalScreen, PGBLScreen, ScoreSaudeScreen };',
  },
  'screens-sheet.jsx': {
    dest: 'screens/screens-sheet.jsx',
    header: `import React from 'react';
import { AppData } from '../data.js';
import { fmt } from '../data.js';
`,
    exports: 'export { RecorrenciasSheet };',
  },
};

for (const [srcFile, cfg] of Object.entries(FILE_CONFIG)) {
  const content = fs.readFileSync(path.join(SRC, srcFile), 'utf8');
  const cleaned = content
    .replace(/^\/\/.*\n/gm, (m, offset) => {
      // keep first comment line in some files? Actually remove Object.assign only
      return m;
    })
    .replace(/Object\.assign\(window,\s*\{[^}]*\}\);?\s*/g, '')
    .replace(/Object\.assign\(window,\s*\{[\s\S]*?\}\);?\s*/g, '');

  const destPath = path.join(DST, cfg.dest);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, cfg.header + cleaned.trimEnd() + '\n\n' + cfg.exports + '\n');
  console.log('Ported:', cfg.dest);
}

console.log('Done.');
