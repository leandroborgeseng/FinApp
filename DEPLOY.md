# Deploy no Railway — FinApp

## 1. Criar serviços

No projeto Railway:

1. **FinApp** — conectado ao repositório GitHub `leandroborgeseng/FinApp`
2. **PostgreSQL** — plugin/addon de banco de dados

## 2. Conectar o banco ao app

No serviço **FinApp** → **Variables** → **Add Variable Reference**:

| Variável no FinApp | Referência |
|--------------------|------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |

> O nome `Postgres` pode variar — use o nome exato do seu serviço PostgreSQL no Railway (ex.: `PostgreSQL`, `postgres`).

Ou use o botão **Connect** do PostgreSQL apontando para o serviço FinApp (Railway cria a referência automaticamente).

## 3. Variáveis de ambiente (copiar no Railway)

No serviço **FinApp** → **Variables**:

```env
NODE_ENV=production
JWT_SECRET=COLE_AQUI_UMA_STRING_ALEATORIA_DE_64_CARACTERES
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Gerar JWT_SECRET

No terminal:

```bash
openssl rand -hex 32
```

Cole o resultado em `JWT_SECRET`. Exemplo (não use este — gere o seu):

```
a3f8c2e91b0476d5e8f0a1c3b5d7e9f1a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2
```

### Variáveis que o Railway define sozinho

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta HTTP — **não defina manualmente** |
| `RAILWAY_*` | Metadados internos — ignore |

### Variáveis que você NÃO precisa

| Variável | Motivo |
|----------|--------|
| `VITE_API_URL` | Em produção a API é servida no mesmo domínio (`/api`) |

## 4. Build e start

Já configurado em `railway.toml`:

- **Build:** `npm install --include=dev && npm run build`
- **Start:** `npm start`
- **Health check:** `GET /health`

## 5. Domínio público

FinApp → **Settings** → **Networking** → **Generate Domain**

Acesse `https://seu-app.up.railway.app`

## 6. Primeiro acesso

Após o deploy com Postgres conectado:

| Campo | Valor |
|-------|-------|
| E-mail | `demo@finapp.com` |
| Senha | `finapp2026` |

O servidor cria automaticamente o usuário demo e popula os dados na primeira subida.

Para desabilitar o seed demo no futuro, adicione `SEED_DEMO_USER=false`.

## 7. Verificar se funcionou

Logs do deploy devem mostrar:

```
[db] Migrations aplicadas
[db] Usuário demo criado: demo@finapp.com / finapp2026
FinApp rodando em http://0.0.0.0:XXXX (produção)
[config] DB: PostgreSQL
```

Teste manual:

```bash
curl https://SEU-DOMINIO.up.railway.app/health
# {"ok":true}
```

## 8. Checklist rápido

- [ ] PostgreSQL criado no mesmo projeto
- [ ] `DATABASE_URL` referenciando o Postgres
- [ ] `JWT_SECRET` com 32+ caracteres (hex 32 = 64 chars)
- [ ] `NODE_ENV=production`
- [ ] Domínio público gerado
- [ ] Login demo funciona
- [ ] Criar lançamento → F5 → dado permanece

## 9. Troubleshooting

| Problema | Solução |
|----------|---------|
| App reinicia em loop | Verifique `JWT_SECRET` e `DATABASE_URL` nos logs |
| `DATABASE_URL` ausente | Conecte o plugin Postgres ao serviço FinApp |
| Erro SSL no Postgres | Já tratado no código (`rejectUnauthorized: false`) |
| 401 em todas as rotas | Token expirado — faça logout e login novamente |
| Dados somem ao reiniciar | `DATABASE_URL` não está configurada (modo memória) |
