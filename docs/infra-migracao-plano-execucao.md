# Plano de execucao - migracao para Vercel + Supabase + Render

Data: 2026-07-09

## Decisao

Migrar o EmpresaFacil do desenho atual em GCP para:

```text
Vercel
  Frontend Vite/React

Render
  Backend Node/Fastify

Supabase
  PostgreSQL gerenciado
```

O ambiente GCP deve continuar ativo ate a validacao completa do novo ambiente.

## Estado local preparado

- `render.yaml` ja existe e descreve o backend `empresafacil-api` como Web Service em `server/`.
- `vercel.json` foi criado para buildar `npm run build`, publicar `dist/` e preservar fallback SPA para React Router.
- O backend ja usa `DATABASE_URL`, entao pode apontar para Supabase sem alteracao estrutural.

## Bloqueio atual de auditoria GCP

O `gcloud` esta instalado e configurado com:

```text
account: gersonvan@gersonvan.com.br
project: x-object-496819-e3
```

Mas as chamadas ao Cloud Run, Cloud SQL e GCS falharam por reautenticacao:

```text
Reauthentication failed. cannot prompt during non-interactive execution.
```

Antes da migracao real, reautenticar:

```bash
gcloud auth login
gcloud config set project x-object-496819-e3
```

## Auditoria GCP executada em 2026-07-12

A auditoria autenticada confirmou que o ambiente de producao e maior que o
primeiro desenho local indicava:

- Cloud Run, `southamerica-east1`:
  - `empresafacil-api`, publico e saudavel (`/health` e `/ready` retornaram
    `200`);
  - `empresafacil-sync`, ativo, mas restrito por IAM (`403` sem identidade);
  - `empresafacil-web`, ativo, mas restrito por IAM (`403` sem identidade).
  As revisoes atualmente servidas de `sync` e `web` sao de 25/05/2026; as
  revisoes recentes da API sao de 16/06/2026. Como somente a API e o bucket
  constam no `cloudbuild.yaml` atual, `sync` e `web` sao candidatos a legado,
  mas essa conclusao exige confirmar seus consumidores antes de qualquer
  desligamento.
- Cloud SQL: instancia `empresafacil-pg`, PostgreSQL 15, banco
  `empresafacil`, estado `RUNNABLE`, com backups automaticos diarios e
  retencao de sete backups.
- Bucket: `empresafacil.gersonvan.com.br` em `SOUTHAMERICA-EAST1`.
  O dominio responde `200` na raiz, mas `404` em `/dashboard`; o fallback SPA
  deve ser preservado na Vercel pelo `vercel.json`.
- O projeto nao tem domain mappings do Cloud Run nesta regiao. A zona Cloud
  DNS tambem nao esta habilitada neste projeto; a autoridade de DNS precisa
  ser localizada fora dele antes da troca do dominio.

Implicacao: o escopo de migracao deve incluir a decisao explicita para
`empresafacil-sync` e `empresafacil-web`. Eles nao devem ser desligados nem
substituidos apenas pelo backend Render sem identificar seus consumidores e
requisitos de autenticacao.

## Auditoria GCP a executar depois da reautenticacao

Nao imprimir valores de segredos em chat/log. Usar comandos que listem nomes/metadados.

### Cloud Run

```bash
gcloud run services describe empresafacil-api \
  --region=southamerica-east1 \
  --project=x-object-496819-e3 \
  --format='value(status.url)'
```

```bash
gcloud run services describe empresafacil-api \
  --region=southamerica-east1 \
  --project=x-object-496819-e3 \
  --format='flattened(spec.template.spec.containers[].env[].name)'
```

### Cloud SQL

```bash
gcloud sql instances list \
  --project=x-object-496819-e3 \
  --format='table(name,databaseVersion,region,tier,settings.activationPolicy,state)'
```

### GCS

```bash
gcloud storage buckets list \
  --project=x-object-496819-e3 \
  --format='table(name,location,storageClass)'
```

```bash
gcloud storage buckets describe gs://empresafacil.gersonvan.com.br \
  --format='yaml(name,location,storageClass,website,iamConfiguration)'
```

## Variaveis a migrar

Backend Render:

- `NODE_ENV=production`
- `PORT=3333`
- `HOST=0.0.0.0`
- `DATABASE_URL`
- `JWT_SECRET`
- `BACKEND_URL`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_BUSINESS`

Frontend Vercel:

- `VITE_API_URL=https://<render-backend-url>`

## Ordem recomendada

### Fase 1 - Banco Supabase

1. Criar projeto Supabase.
2. Copiar connection string PostgreSQL.
3. Rodar migrations do backend contra Supabase:

```bash
cd server
DATABASE_URL='<supabase-postgres-url>' npm run db:migrate
```

4. Se houver dados atuais em producao, exportar do banco atual e importar no Supabase.
5. Validar tabelas:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

### Fase 2 - Backend Render

1. Criar Web Service no Render conectado ao repo.
2. Usar `render.yaml` como base.
3. Configurar `rootDir=server`.
4. Configurar env vars.
5. Apontar `DATABASE_URL` para Supabase.
6. Deploy.
7. Validar:

```bash
curl https://<render-backend-url>/health
curl https://<render-backend-url>/ready
```

### Fase 3 - Frontend Vercel

1. Criar projeto Vercel no repo.
2. Configurar:

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

3. Configurar env var:

```text
VITE_API_URL=https://<render-backend-url>
```

4. Deploy preview.
5. Validar rotas internas do React Router:

```text
/dashboard
/launch
/dre
/month-review
```

### Fase 4 - Integrações externas

Atualizar callbacks/URLs:

- OAuth Google:
  - backend callback Render.
  - frontend URL Vercel.
- OAuth Microsoft, se usado.
- Stripe:
  - webhook para Render.
  - success/cancel URLs se houver.
- SMTP:
  - verificar remetente e credenciais.

### Fase 5 - Smoke test

Checklist minimo:

- Login ou magic link.
- `/auth/me`.
- Dashboard autenticado.
- Criar empresa ou reivindicar empresa.
- Criar lancamento.
- Sync push/pull.
- Ver DRE.
- Revisao mensal.
- Convite de membro.
- Checkout/portal Stripe em modo seguro/teste, se aplicavel.

### Fase 6 - Cutover

1. Baixar TTL do DNS antes da troca.
2. Fazer backup final do banco atual.
3. Congelar escrita se necessario.
4. Importar delta final no Supabase, se houver.
5. Trocar DNS frontend para Vercel.
6. Atualizar `FRONTEND_URL` e `BACKEND_URL`.
7. Monitorar logs Render/Vercel/Supabase.
8. Manter GCP ativo ate estabilizar.

## Rollback

Enquanto DNS e dados antigos forem preservados:

1. Reapontar DNS frontend para GCS antigo.
2. Reverter callbacks OAuth/Stripe para Cloud Run/GCS.
3. Manter banco antigo sem alteracao ate confirmar consistencia.

Se houver escrita no banco novo depois do cutover, rollback exige reconciliacao/export do Supabase antes de voltar.

## Pendencias abertas

- Confirmar provedor atual do PostgreSQL.
- Inventariar consumidores, endpoints e autenticacao de `empresafacil-sync` e
  `empresafacil-web` antes de definir seus destinos.
- Localizar o provedor/zona que controla `empresafacil.gersonvan.com.br`.
- Confirmar se existem dados reais em producao.
- Confirmar dominios finais:
  - frontend atual.
  - frontend novo Vercel.
  - backend novo Render.
- Confirmar se OAuth Google/Microsoft estao ativos.
- Confirmar Stripe em producao ou teste.
- Definir plano Supabase.
- Definir plano Render.
