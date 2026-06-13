# Handoff: FinApp — Gestor Financeiro Pessoal + PJ

## Visão Geral

Aplicativo mobile de gestão financeira pessoal integrada com pessoa jurídica (PJ). O usuário é um profissional autônomo/empresário que precisa controlar simultaneamente as finanças da empresa (PJ) e pessoais (PF), incluindo repasse PJ→PF, investimentos, financiamentos e meta de independência financeira em 2029 (R$ 3M).

## Sobre os Arquivos de Design

Os arquivos HTML neste pacote são **protótipos de alta fidelidade** criados como referência de design. Eles mostram com precisão visual, fluxo e comportamento esperados de cada tela. A tarefa do desenvolvedor é **recriar esses designs no ambiente do app real** (React Native, Flutter, Swift, etc.) usando os padrões e bibliotecas existentes do projeto — não copiar o HTML diretamente.

## Fidelidade

**Alta fidelidade (hifi)**: Os protótipos têm cores finais, tipografia, espaçamento e interações definidas com precisão. O desenvolvedor deve recriar o UI pixel a pixel usando as bibliotecas existentes do projeto. Todos os valores de cor, fonte, raio de borda e sombra estão documentados abaixo.

---

## Design Tokens

### Cores

```
// Fundo e neutros
--bg-app:        #F7F8FA   (fundo geral do app)
--bg-card:       #FFFFFF   (cards)
--bg-input:      #F7F8FA   (inputs)
--border:        #ECEEF4   (bordas leves)
--border-subtle: #F4F5F8   (separadores internos)

// Texto
--text-primary:  #1A1F36   (títulos, valores)
--text-secondary:#8B90A0   (labels, subtítulos)
--text-muted:    #C4C7D4   (hints, placeholders)

// Brand principal
--brand-dark:    #1A1F36   (header, hero dark)
--brand-blue:    #2563EB   (PF, ações primárias, CTA)
--brand-purple:  #7C3AED   (PJ, investimentos)
--brand-mid:     #253056   (gradiente hero)

// Semânticas
--green-500:     #16A34A   (receita, positivo, ok)
--green-400:     #22C55E   (saldo ok)
--green-100:     #F0FDF4   (bg success)
--green-spark:   #86EFAC   (sparklines, hero)

--red-600:       #DC2626   (despesa, negativo, dívida)
--red-100:       #FEF2F2   (bg danger)
--red-spark:     #FCA5A5   (hero despesa)

--yellow-500:    #F59E0B   (alerta, previsto)
--yellow-100:    #FFFBEB   (bg warning)

--blue-100:      #EFF6FF   (bg PF leve)
--purple-100:    #F5F3FF   (bg PJ leve)
```

### Tipografia

```
Font family: DM Sans (Google Fonts)
Weights usados: 400, 500, 600, 700, 800

Escala:
--text-xs:    8px  / weight 600   (labels de badge, uppercase)
--text-sm:    10px / weight 500   (meta info, hints)
--text-base:  11px / weight 600   (sublabels, descrições)
--text-md:    12px / weight 600   (body, listas)
--text-lg:    13px / weight 600-700 (itens de lista)
--text-xl:    14px / weight 700   (valores secundários)
--text-2xl:   16px / weight 700-800 (valores de card)
--text-3xl:   20px / weight 700   (títulos de seção)
--text-hero:  32-36px / weight 800 (patrimônio líquido)
letter-spacing hero: -0.5px
```

### Espaçamento

```
--radius-xs:  6px   (badges)
--radius-sm:  8px   (tags, chips internos)
--radius-md:  10px  (mini cards internos)
--radius-lg:  12px  (cards secundários)
--radius-xl:  14px  (inputs, botões)
--radius-2xl: 16px  (cards principais)
--radius-3xl: 22px  (hero cards)
--radius-phone: 54px (frame do dispositivo)

Gap padrão entre cards: 12-14px
Padding interno de card: 13-16px
Padding de tela: 18px horizontal, 68px top (status bar + nav), 100px bottom (tab bar)
```

### Sombras

```
Card:       box-shadow: 0 1px 4px rgba(26,31,54,0.07), 0 2px 8px rgba(26,31,54,0.05)
Hero card:  box-shadow: 0 6px 24px rgba(26,31,54,0.22)
Tab bar:    box-shadow: 0 -1px 0 #ECEEF4, 0 -4px 20px rgba(26,31,54,0.07)
```

---

## Estrutura de Navegação

```
App
├── Onboarding (3 slides) → Login
│
└── MainApp
    ├── [tab] Dashboard
    │   ├── Hero patrimônio (count-up animation)
    │   ├── Card repasse PJ→PF
    │   ├── Taxa de poupança (donut mini)
    │   ├── 6 stat cards clicáveis → Movimentos filtrado
    │   ├── Gráfico fluxo de caixa (BarChart 12 meses)
    │   ├── Evolução CDB (AreaChart)
    │   ├── Próximos lançamentos (com botão ✓)
    │   └── Notificações
    │
    ├── [tab] Movimentos
    │   ├── Seletor de mês (← Jun/26 →) [31 meses]
    │   ├── Toggle PF / PJ / Todos
    │   ├── Tabs: Lista | Fluxo | Diário
    │   │   ├── Lista: rows expandíveis (editar/confirmar/excluir)
    │   │   │   └── Alertas de categoria (75%+ do orçado)
    │   │   ├── Fluxo: step chart do mês por dia
    │   │   └── Diário: saldo corrido dia a dia com drill-down
    │   └── Summary bar (receitas / despesas / saldo)
    │
    ├── [tab] Planejamento
    │   ├── Toggle Orçado vs. Realizado
    │   ├── 31 meses expansíveis
    │   └── Detalhe: receitas, despesas, aplicações, repasse, CDB
    │
    ├── [tab] Patrimônio
    │   ├── Tabs: Visão Geral | Investimentos | Metas | Financiamentos
    │   │   ├── Visão Geral: hero líquido, gráfico projeção, donut composição
    │   │   ├── Investimentos: PF + PJ, drill-down com projeção 1/2/5 anos
    │   │   ├── Metas: progresso, drill-down com aporte necessário + gráfico
    │   │   └── Financiamentos: 4 contratos, drill-down com simulador amortização
    │
    └── [tab] Mais
        ├── 10 ferramentas (sub-telas)
        ├── Organização (contas, cartões, recorrências)
        ├── Dados (importar, exportar, backup)
        └── Preferências (tema, segurança)

Sub-telas (sobrepõem MainApp, animação slide-in da direita):
    ├── Repasse PJ→PF
    ├── Gestão Financeira (3 tabs: financ, invest, recorr)
    ├── Independência Financeira
    ├── Análise Tributária PJ
    ├── Comparativo de Meses
    ├── Calculadora de Rentabilidade
    ├── Simulador "E Se?"
    ├── Relatório Mensal
    ├── PGBL vs CDB
    ├── Score de Saúde Financeira
    └── Planilha de Recorrências (spreadsheet)
```

---

## Telas e Componentes

### 1. Onboarding + Login

**Fluxo**: 3 slides → tela de login → app principal

**Slides (390×844px):**
- Status bar: background `#1A1F36`, altura 50px
- Slide 1: ícone gráfico de barras, cor `#2563EB`
- Slide 2: donut/ring, cor `#7C3AED`
- Slide 3: gráfico crescente, cor `#16A34A`
- Dots de progresso: ativo = 24px width, inativo = 8px (cor `#ECEEF4`)
- Botão CTA: `padding 16px`, `border-radius 16px`, gradiente da cor do slide
- Botão "Pular": canto superior direito, texto `#8B90A0`

**Login:**
- Header escuro `#1A1F36` com círculos decorativos (opacity 0.18 e 0.14)
- Logo: ícone de barras + "FinApp" (18px, weight 800)
- Campos: `padding 14px 16px`, `border-radius 14px`, foco = border `#2563EB`
- Botão entrar: gradiente `#1A1F36 → #2563EB`, spinner durante loading
- Banner demo: background `#EFF6FF`, border `#DBEAFE`

**Persistência**: `localStorage.setItem('fin_logged_in', '1')`

---

### 2. Tab Bar (Bottom Navigation)

5 abas: Dashboard · Movimentos · Planejamento · Patrimônio · Mais

```
Altura: 82px
Background: #FFFFFF
Border top: 1px solid #ECEEF4
Box-shadow: 0 -4px 20px rgba(26,31,54,0.07)
Padding bottom: 20px (safe area)

Item ativo:
  - Ícone: SVG 22×22, stroke #2563EB
  - Label: 10px, weight 700, color #2563EB

Item inativo:
  - Ícone: stroke #C4C7D4
  - Label: 10px, weight 500, color #8B90A0
```

---

### 3. Dashboard

**Hero card** (patrimônio líquido):
```
Background: linear-gradient(145deg, #1A1F36, #253056)
Border-radius: 28px
Padding: 20px 22px 22px
Box-shadow: 0 8px 32px rgba(26,31,54,0.28)

- Label "PATRIMÔNIO LÍQUIDO": 10px, uppercase, #94A3CC
- Valor: 34px, weight 800, #FFFFFF, letter-spacing -0.5px
  → Animação count-up (0→1.250.000 em 1.6s, ease-out quart)
- SparkLine decorativa: direita/baixo, opacity 0.18, cor #60A5FA
- 3 métricas abaixo (prox. mês, CDB, repasse):
  - Separador vertical: 1px rgba(255,255,255,0.15)
  - Label: 9px, #94A3CC, uppercase
  - Valor: 15px, weight 700
```

**Stat cards** (grid 2×3):
```
Background: #FFFFFF
Border-radius: 16px
Padding: 13px 15px
Cursor: pointer (navega para Movimentos filtrado)
Seta no canto: SVG 10×10, cor #C4C7D4

- Label: 11px, weight 500, #8B90A0
- Valor: 16px, weight 700, #1A1F36 (negativo = #DC2626)
- SparkLine: 110×22px, cor específica por card
```

**Alertas de categoria** (aparecem em Movimentos):
```
Background: #FFFBEB (warn) / #FEF2F2 (danger)
Border-radius: 12px
Border: 1px solid #FDE68A / #FECACA
Ícone: "~" (warn) / "!" (danger), background cor+'20'
```

---

### 4. Movimentos

**Seletor de mês:**
```
Background: #FFFFFF, border-radius 12px, padding 3px
Botões ← →: 32×32px, border-radius 50%, border 1.5px #ECEEF4
Texto mês: 15px, weight 800, #1A1F36
```

**Row de transação:**
```
Ícone: 38×38px, border-radius 12px
  income:   bg #F0FDF4, cor #16A34A, glyph ↑
  expense:  bg #FEF2F2, cor #DC2626, glyph ↓
  transfer: bg #EFF6FF, cor #2563EB, glyph ⇄

Descrição: 14px, weight 600, #1A1F36
Data: 11px, #8B90A0
Tags: padding 2px 7px, border-radius 6px

Expand panel (ao tocar):
  - Fundo #F7F8FA, border-radius 12px, padding 12px
  - 3 inputs editáveis (desc, valor, categoria)
  - Botões: Salvar (azul), Confirmar (verde/vermelho), ✕ (vermelho)
```

**Fluxo Diário:**
```
Banner de abertura: gradient #1A1F36→#253056, border-radius 16px
Saldo ok:     bg #F0FDF4, cor #16A34A
Saldo baixo:  bg #FFFBEB, cor #F59E0B (< 15% do saldo inicial)
Saldo negativo: bg #FEF2F2, cor #DC2626

Day badge: 40px wide, dia em 18px weight 800
"HOJE": badge azul 8px sobre o número
```

---

### 5. Planejamento

**Row de mês:**
```
Expand: mostra 4 sub-cards (receitas, despesas, aplicações, repasse/CDB)
Toggle Orçado/Realizado: pills com transição suave
Delta %: badge colorido (verde positivo, vermelho negativo)
```

---

### 6. Patrimônio

**Donut chart (composição):**
```
Size: 110px, thickness: 18px
Segmentos: Invest. PF (#2563EB), Invest. PJ (#7C3AED),
           PF Disponível (#16A34A), PJ Disponível (#22C55E),
           Dívidas (#EF4444)
Gap entre segmentos: 3°
```

**Investimentos drill-down:**
```
Expand: projeção 1/2/5 anos em grid 3 colunas
        + AreaChart 0→24m, cor do segmento
```

**Financiamentos drill-down:**
```
Simulador extra/mês: input → recalcula PRICE ao vivo
Resultado: meses economizados, juros salvos, novo prazo
Tabela: 4 colunas (Mês, Juros, Amort., Saldo), 8 linhas
AreaChart saldo devedor, cor #EF4444
```

---

### 7. Sub-telas (slide-in)

Todas seguem o padrão:
```
Background: #F7F8FA (fundo)
Botão voltar: 36×36px, border-radius 50%, bg #FFFFFF,
              border 1.5px #ECEEF4, shadow 0 1px 4px rgba(26,31,54,0.08)
              SVG chevron esquerda 16×16
Título: 19px, weight 700, #1A1F36
Subtítulo: 11px, #8B90A0
Padding: 68px 18px 100px
Gap entre seções: 14px
```

**Repasse PJ→PF:**
```
Hero bar anual: fundo #1A1F36, barra de progresso, cor por %
  verde <50%, amarelo <75%, laranja <90%, vermelho ≥90%
Limite anual: R$ 600.000 (50k/mês máximo)
Lista mensal: toggle done/pendente, input de valor por mês
```

**Planilha de Recorrências:**
```
Layout: sticky primeira coluna (130px) + scroll horizontal
Coluna mês: 74px, 31 colunas (Jun/26→Dez/28)
Células: toque para editar inline (input focado)
Totais: 3 linhas fixas no rodapé (receitas/despesas/saldo)
Ponto laranja: célula com override (posição absolute top:3 right:4)
Persiste em localStorage ('recorr_overrides_v1')
```

**Score de Saúde Financeira:**
```
Notas: A (≥85), B (≥70), C (≥55), D (≥40), E (<40)
Cores: A=#16A34A, B=#22C55E, C=#F59E0B, D=#F97316, E=#DC2626
5 pilares: Taxa Poupança(25), Emergência(20), Diversific.(20),
           Dívida/Renda(20), Metas(15)
Donut: grade letter no centro (26px weight 900)
```

---

## Interações & Comportamento

### Navegação entre telas
- Sub-telas deslizam da direita (slide-in) sobre o conteúdo principal
- Botão voltar: fecha sub-tela e volta ao estado anterior
- Tab bar: muda aba ativa, sempre visível exceto em sub-telas (sub-telas cobrem tudo)

### Animações
```
Count-up patrimônio: 0→valor em 1600ms, ease-out quart (1 - (1-p)^4)
Barras de progresso: width transition 0.6s ease
Expand/collapse: não animado (toggle imediato)
Dots onboarding: width 8→24px, transition 0.3s ease
Spinner login: rotate 360° em 0.7s linear
```

### Estados de cada row (Movimentos)
```
Previsto: tag amarela, ícone sem fill
Realizado: tag verde, ícone com fill (done = true)
Excluído: removido do array de transações
```

### Alertas automáticos
- Categoria > 75% do orçado → banner amarelo
- Categoria > 100% → banner vermelho
- Calculado sobre `monthlyEvents[].value` como orçado vs `transactions[done=true]` como realizado

### Persistência (localStorage)
```
'fin_logged_in'        → '1' quando autenticado
'fin_user_email'       → email do usuário
'recorr_overrides_v1'  → JSON de overrides da planilha
'repasse_state'        → estado do repasse PJ→PF (opcional)
```

---

## Modelos de Dados

### Transação
```typescript
interface Transaction {
  id:     string;      // uuid
  desc:   string;      // "Cartão Master"
  value:  number;      // 3390 (sempre positivo)
  type:   'income' | 'expense' | 'transfer' | 'invest';
  entity: 'PF' | 'PJ';
  date:   string;      // "2026-06-11" (ISO)
  done:   boolean;     // realizado ou previsto
  cat:    string;      // "Cartão", "Salário", etc.
}
```

### Lançamento Recorrente
```typescript
interface MonthlyEvent {
  desc:   string;
  type:   'income' | 'expense';
  value:  number;
  day:    number;      // dia do mês (1-31)
  entity: 'PF' | 'PJ';
  cat:    string;
}
```

### Orçamento Mensal
```typescript
interface MonthlyBudget {
  m:       string;     // "Jun/26"
  pjInc:   number;     // receita PJ
  pjSaldo: number;     // sobra PJ
  aplicPJ: number;     // aplicação CDB PJ
  pfInc:   number;     // receita PF (inclui repasse)
  pfSaldo: number;     // sobra PF
  aplicPF: number;     // aplicação CDB PF
  repasse: number;     // repasse PJ→PF do mês
  cdb:     number;     // CDB acumulado
  cdbRet:  number;     // rendimento CDB do mês
}
```

### Investimento
```typescript
interface Investment {
  name:    string;     // "CDB PF (acumulado)"
  value:   number;     // saldo atual
  ret:     number;     // rentabilidade anual %
  monthly: number;     // aporte mensal
}
```

### Financiamento
```typescript
interface Financing {
  id:              string;
  bank:            string;    // "Santander · Sala Comercial"
  balance:         number;    // saldo devedor atual
  installment:     number;    // parcela mensal
  endYear:         number;    // 2032
  entity:          'PF' | 'PJ';
  cet:             number;    // taxa efetiva anual %
  originalBalance: number;    // valor original do financiamento
  cat:             string;    // "Imóvel Comercial"
}
```

### Meta
```typescript
interface Goal {
  name:          string;
  target:        number;
  current:       number;
  year:          number;      // ano alvo
  monthlyAporte?: number;     // aporte mensal atual (opcional)
}
```

### Repasse PJ→PF
```typescript
interface RepasseState {
  day:         number;       // dia do repasse (padrão: 5)
  monthlyLimit:number;       // 50000
  annualLimit: number;       // 600000
  year:        number;       // 2026
  months: Array<{
    m:      string;          // "Jan"
    amount: number;          // valor do mês
    done:   boolean;         // realizado?
  }>;
}
```

---

## Especificação de API

O app precisa dos seguintes endpoints backend:

```
Auth:
  POST /auth/login          { email, password } → { token, user }
  POST /auth/logout
  GET  /auth/me             → { id, name, email, plan }

Transações:
  GET  /transactions        ?month=2026-06&entity=PF|PJ|all
  POST /transactions        { desc, value, type, entity, date, cat }
  PUT  /transactions/:id    { desc?, value?, cat?, done? }
  DEL  /transactions/:id

Orçamento:
  GET  /budget              ?from=2026-06&to=2028-12
  PUT  /budget/:month       { pjInc, pjSaldo, pfInc, pfSaldo, ... }

Investimentos:
  GET  /investments         → { pf: [...], pj: [...] }
  PUT  /investments/:id     { value?, monthly? }

Financiamentos:
  GET  /financings          → Financing[]
  PUT  /financings/:id      { balance?, installment? }

Repasse:
  GET  /repasse             → RepasseState
  PUT  /repasse             { months: [...] }
  PUT  /repasse/month/:idx  { amount?, done? }

Metas:
  GET  /goals               → Goal[]
  PUT  /goals/:id           { current?, monthlyAporte? }

Patrimônio:
  GET  /net-worth           → { netWorth, pfAvailable, pjAvailable, ... }
  GET  /wealth-forecast     → { year, value }[]

Planilha:
  GET  /recurring-overrides → Record<rowIdx, Record<monthIdx, number>>
  PUT  /recurring-overrides { overrides }
```

---

## Dados Reais do Usuário

```
Patrimônio líquido: R$ 1.250.000
PF disponível:      R$ 85.000
PJ disponível:      R$ 320.000
Invest. PF total:   R$ 410.000
Invest. PJ total:   R$ 280.000
Dívidas:            R$ 170.000
Sobra mensal:       R$ 46.448/mês (jun/26)

Período de orçamento: Jun/2026 → Dez/2028 (31 meses)
Meta de independência: R$ 3.000.000 em 2029
Repasse anual máximo:  R$ 600.000 (R$ 50k/mês)

Principais receitas PJ:
  - FIPEC:      R$ 33.440/mês (dia 20)
  - UNIMED HSJ: R$ 26.086/mês (dia 15)
  - Microblau:  R$ 2.375/mês  (dia 20)

Financiamentos:
  - Santander Sala: R$ 118k saldo, R$ 2.897/mês, CET 9,5%, até 2032
  - Veículo:        R$ 71k saldo,  R$ 7.300/mês, CET 13,5%, até 2027
  - Fin. PF:        R$ 24,5k saldo,R$ 1.637/mês, CET 14,5%, até 2027
  - Consignado:     R$ 14,3k saldo,R$ 1.100/mês, CET 12%, até 2027
```

---

## Gráficos Necessários

| Gráfico | Tipo | Onde | Cor |
|---|---|---|---|
| Patrimônio histórico | SparkLine | Dashboard hero | #60A5FA |
| Stat cards | SparkLine | Dashboard grid | Variável por card |
| Fluxo de caixa | BarChart grouped | Dashboard | verde/vermelho |
| CDB projeção | AreaChart | Dashboard | #22C55E |
| Saldo diário | StepChart | Movimentos > Fluxo | #2563EB |
| Projeção patrimônio | AreaChart | Patrimônio > Visão Geral | #2563EB |
| Composição | DonutChart | Patrimônio > Visão Geral | Multi |
| Evolução investimento | AreaChart | Patrimônio > Investimentos | Variável |
| Trajetória meta | AreaChart c/ linha meta | Patrimônio > Metas | #2563EB |
| Saldo financiamento | AreaChart | Patrimônio > Financiamentos | #EF4444 |
| Independência | AreaChart c/ linha meta | Mais > Independência | #2563EB |
| Score saúde | DonutChart multi | Mais > Score | Multi |
| Calculadora | AreaChart | Mais > Calculadora | #2563EB |
| Simulador | AreaChart duplo | Mais > Simulador | Azul + Verde |

---

## Assets

- Fonte: **DM Sans** via Google Fonts
  `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800`
- Ícones: SVG inline (não usa biblioteca de ícones — todos desenhados inline)
- Sem imagens externas

---

## Arquivos de Referência

```
Financial App.html    → Entry point do protótipo (carregar no browser)
data.jsx              → Todos os dados reais (modelo completo)
app.jsx               → Roteamento e estado global
onboarding.jsx        → Login + 3 slides de onboarding
screens-a.jsx         → Dashboard + Movimentos (FluxoDiarioView incluso)
screens-b.jsx         → Planejamento + Patrimônio + Mais + Financiamentos
screens-c.jsx         → FluxoView (fluxo do mês em step chart)
screens-repasse.jsx   → Sub-tela Repasse PJ→PF
screens-gestao.jsx    → Sub-tela Gestão Financeira (3 tabs)
screens-analise.jsx   → Independência + Análise Tributária PJ
screens-extra.jsx     → Comparativo de Meses + Calculadora de Rentabilidade
screens-tools.jsx     → Simulador E Se? + Relatório + PGBL + Score
screens-sheet.jsx     → Planilha de Recorrências (spreadsheet)
charts.jsx            → SparkLine, BarChart, AreaChart, DonutChart, StepChart
navigation.jsx        → Tab bar bottom
modal.jsx             → Modal de novo lançamento
ios-frame.jsx         → Frame do dispositivo iOS (apenas no protótipo)
```

---

## Notas para o Desenvolvedor

1. **Separação PF/PJ** é central — todo lançamento tem `entity: 'PF' | 'PJ'`. Filtragem é onipresente.

2. **Repasse PJ→PF** é a transferência de dinheiro da empresa para o pessoal. Tem limite legal de R$ 600k/ano. Ao confirmar, gera duas transações (saída PJ + entrada PF).

3. **Orçamento de 31 meses** (Jun/26→Dez/28) é pré-calculado. O backend precisa servir isso ou permitir que o usuário importe do Excel.

4. **Amortização PRICE**: `juros = saldo * (CET/12)`, `amortização = parcela - juros`, `novo saldo = saldo - amortização`.

5. **Score de saúde financeira** é calculado 100% no cliente com dados do usuário — não precisa de endpoint específico.

6. **Planilha de recorrências** sobrescreve valores específicos (mês+linha) preservando o padrão base. O override é esparso — não substituir a linha inteira.

7. **Fluxo Diário** combina `transactions` (reais) com `monthlyEvents` projetados para o mês selecionado, evitando duplicatas por `(desc, date)`.
