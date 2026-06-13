# FinApp — Gestor Financeiro Pessoal + PJ

Aplicativo de gestão financeira integrando PF e PJ, baseado no handoff em `design_handoff_finapp/`.

## Executar

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:5173
- **API mock:** http://localhost:3001

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Frontend + API em paralelo |
| `npm run dev:client` | Apenas Vite |
| `npm run dev:server` | Apenas API mock |
| `npm run build` | Build de produção |

## Estrutura

```
src/
  App.jsx              — Roteamento principal
  data.js              — Dados reais (orçamento 2026–2028)
  components/          — Charts, navegação, onboarding, modal
  screens/             — Dashboard, Movimentos, Patrimônio, sub-telas
server/
  index.js             — API REST mock (endpoints do README)
design_handoff_finapp/ — Protótipo HTML de referência visual
```

## Login demo

Qualquer e-mail/senha funciona. A sessão persiste em `localStorage` (`fin_logged_in`).

## Referência de design

Consulte `design_handoff_finapp/README.md` para tokens, navegação e especificações completas.

## Deploy no Railway

1. Conecte o repositório GitHub ao Railway
2. O Railway detecta `railway.toml` automaticamente
3. Variáveis de ambiente recomendadas:
   - `NODE_ENV=production`
4. O serviço único serve o frontend (`dist/`) e a API na mesma porta (`PORT`)
