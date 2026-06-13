# Versão final — FinApp (uso pessoal)

Checklist para considerar o app **pronto para uso diário**.

## 1. Conta e deploy (uma vez)

- [ ] Railway: `JWT_SECRET`, `DATABASE_URL`, `NODE_ENV=production`
- [ ] Primeiro acesso: login com `demo@finapp.com` / `finapp2026` (criado automaticamente)
- [ ] Trocar senha: no Postgres ou recriar conta com `ALLOW_REGISTER=true` temporário
- [ ] Depois de configurar: `SEED_DEMO_USER=false` e `ALLOW_REGISTER=false` no Railway
- [ ] `curl https://finapp-lb.up.railway.app/health` → `{"ok":true}`

## 2. Dados reais (G5)

O seed inicial vem de `src/data.js`. **Na primeira subida** (ou se ainda não carregou), o servidor aplica automaticamente:

- Orçamento 31 meses (Jun/26 → Dez/28)
- 22 recorrências da planilha
- **22 lançamentos de Jun/26** gerados das recorrências (marcados realizados se o dia já passou)
- Patrimônio, contas, investimentos, metas e repasse

Depois disso você ajusta pelo app. Para **forçar recarga** da planilha (apaga lançamentos atuais):

```bash
npm run seed:spreadsheet -- --force
```

1. **Patrimônio** → saldos, investimentos, metas
2. **Gestão** → orçamento, financiamentos, contas
3. **Recorrências** → planilha + **Gerar lançamentos** no início de cada mês
4. **Mais → Criar backup** (recomendado a cada 30 dias — o app avisa)

Para resetar tudo: exportar backup, limpar Postgres, redeploy, importar JSON.

## 3. Validação em produção (F1)

- [ ] Login persiste após F5
- [ ] Criar/editar/excluir lançamento
- [ ] Repasse PJ→PF salva
- [ ] Offline: editar sem rede → reconectar → sincroniza
- [ ] Exportar JSON → Importar JSON (round-trip)
- [ ] PWA instalado no celular (Dashboard ou Mais)

## 4. Uso semanal (critério “finalizado”)

- [ ] 1 semana usando no celular sem editar JSON manualmente
- [ ] Backup recente (< 30 dias)
- [ ] Recorrências do mês geradas

## O que já está pronto

| Item | Status |
|------|--------|
| Login direto + lembrar credenciais | ✅ |
| Menu enxuto (Ferramentas essenciais) | ✅ |
| Card de backup com alerta | ✅ |
| Aba inicial salva | ✅ |
| Editar/excluir lançamentos | ✅ |
| Gerar mês (recorrências) | ✅ |
| PWA + offline queue | ✅ |
| Senha não reseta a cada deploy | ✅ |
| Registro bloqueado em produção | ✅ |

## Variáveis opcionais (Railway)

```env
SEED_DEMO_USER=false      # não criar usuário demo
ALLOW_REGISTER=true       # só na primeira configuração de conta
```
