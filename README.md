# FinApp — Gestor Financeiro Pessoal + PJ

App de uso pessoal para integrar finanças PF e PJ: fluxo de caixa, repasse, investimentos, orçamento e PWA offline.

**Produção:** https://finapp-lb.up.railway.app

## Executar

```bash
npm install
npm run dev          # dev: Vite :5173 + API :3001
npm run build && npm start   # produção local
```

- **Frontend dev:** http://localhost:5173
- **API:** http://localhost:5173/api (proxy) ou :3001/api

### Login

Use seu e-mail e senha configurados no deploy. Para testes locais com seed:

| Campo | Valor |
|-------|-------|
| E-mail | `demo@finapp.com` |
| Senha | `finapp2026` |

O app lembra credenciais neste dispositivo (checkbox no login).

### PostgreSQL local (opcional)

```bash
docker compose up -d
cp .env.example .env
# Edite DATABASE_URL=postgresql://finapp:finapp@localhost:5432/finapp
npm run dev
```

Sem `DATABASE_URL`, o servidor usa memória (dados resetam ao reiniciar).

## Uso rápido

| Ação | Onde |
|------|------|
| Novo lançamento | FAB (+) em qualquer aba |
| Repasse PJ → PF | Mais → Ferramentas |
| Contas e cartões | Mais → Organização |
| Recorrências + gerar mês | Mais → Recorrências → **Gerar lançamentos** |
| Backup | Card no topo de Mais |
| Instalar PWA | Banner no Dashboard ou em Mais |

## PWA

- Instalável no Chrome (botão **Instalar**) ou Safari iOS (Compartilhar → Adicionar à Tela de Início)
- Service Worker com cache de assets e API (`NetworkFirst`)
- Fonte DM Sans self-hosted (funciona offline após primeiro acesso)
- **Offline:** IndexedDB + fila de mutações (transações, repasse, investimentos, etc.)
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
```

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

## Versão final

Guia passo a passo em **[VERSAO_FINAL.md](./VERSAO_FINAL.md)** — conta pessoal, dados reais, validação PWA e checklist de uso diário.
