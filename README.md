# FinApp — Gestor Financeiro Pessoal + PJ

Aplicativo de gestão financeira integrando PF e PJ, baseado no handoff em `design_handoff_finapp/`.

## Executar

```bash
npm install
npm run dev          # dev: Vite :5173 + API :3001
npm run build && npm start   # produção local
```

- **Frontend dev:** http://localhost:5173
- **API:** http://localhost:5173/api (proxy) ou :3001/api

### Login demo

| Campo | Valor |
|-------|-------|
| E-mail | `demo@finapp.com` |
| Senha | `finapp2026` |

### PostgreSQL local (opcional)

```bash
docker compose up -d
cp .env.example .env
# Edite DATABASE_URL=postgresql://finapp:finapp@localhost:5432/finapp
npm run dev
```

Sem `DATABASE_URL`, o servidor usa memória (dados resetam ao reiniciar).

## PWA

- Instalável via navegador (banner na aba **Mais**)
- Service Worker com cache de assets e API (`NetworkFirst`)
- Fonte DM Sans self-hosted (funciona offline após primeiro acesso)
- Layout full-viewport com safe areas (sem frame iOS de protótipo)
- **Offline:** IndexedDB cache + fila de mutações (transações enfileiradas sem rede)
- **Export/Import:** JSON na aba Mais → Dados

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Frontend + API em paralelo |
| `npm run dev:client` | Apenas Vite |
| `npm run dev:server` | Apenas API |
| `npm run build` | Build de produção |

## Estrutura

```
src/
  api/                  — client, auth, transactions, backup
  store/offlineQueue.js — fila offline + cache IndexedDB
  hooks/                — useFinance, useSyncStatus, useTransactions
  screens/              — Dashboard, Movimentos, Patrimônio, sub-telas
server/
  store/index.js        — Postgres ou memória
  routes/               — auth, transactions, bootstrap, data
design_handoff_finapp/  — Protótipo HTML de referência visual
```

## Referência de design

Consulte `design_handoff_finapp/README.md` para tokens, navegação e especificações completas.

## Deploy no Railway

Guia completo em **[DEPLOY.md](./DEPLOY.md)**.

### Variáveis (serviço FinApp)

```env
NODE_ENV=production
JWT_SECRET=<gere com: openssl rand -hex 32>
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

1. Adicione o plugin **PostgreSQL** no projeto
2. Conecte o Postgres ao serviço FinApp (referência `DATABASE_URL`)
3. Defina `JWT_SECRET` e `NODE_ENV=production`
4. Gere domínio público em **Settings → Networking**
