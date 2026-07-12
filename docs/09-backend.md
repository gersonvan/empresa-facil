# Backend

## Organizacao interna dos modulos

| Modulo | Proposito | Endpoints expostos | Dependencias internas | Evidencia |
|---|---|---|---|---|
| `healthRoutes` | Healthcheck/readiness | `/health`, `/ready` | pool/banco para readiness | `server/src/routes/health.js:2-11` |
| `authRoutes` | Login OAuth, magic link e usuario atual | `/auth/*` | user, membership, magic link, email, config | `server/src/routes/auth.js:4-116` |
| `onboardingRoutes` | Status e claim de empresa | `/api/onboarding/status`, `/api/companies/claim` | membership/user/company | `server/src/routes/onboarding.js:7-13` |
| `membersRoutes` | Membros e assinatura por empresa | `/api/companies/:companyId/*` | membership, magic link, email, subscription | `server/src/routes/members.js:6-132` |
| `syncRoutes` | Push/pull de eventos | `/api/sync/push`, `/api/sync/pull` | eventStore | `server/src/routes/sync.js:62-79` |
| `backupRoutes` | Exportacao de backup | `/api/backup/export` | eventStore/backup | `server/src/routes/backup.js:2` |
| `adminRoutes` | Operacao administrativa | `/admin/*` | requireAdmin, stores | `server/src/routes/admin.js:8-165` |
| `billingRoutes` | Checkout, portal, webhook | `/billing/*` | Stripe, subscriptionStore, membership | `server/src/routes/billing.js:1-201` |

## Controladores e handlers

Os handlers sao funcoes registradas diretamente nos modulos de rota. A cobertura de endpoints esta em `07-interface-externa.md`; o registro central dos modulos esta em `server/src/app.js:57-64`.

## Servicos e repositorios

| Camada | Padrao | Evidencia |
|---|---|---|
| Event store | Store especializado para eventos/sync | `server/src/eventStore.js:153` |
| User store | Store de usuarios | `server/src/app.js:21` |
| Membership store | Store de membros/empresas | `server/src/app.js:22` |
| Magic link store | Store de tokens de login/convite | `server/src/app.js:23`; `server/src/magicLinkStore.js:20-36` |
| Subscription store | Store de assinatura/billing | `server/src/app.js:24`; `server/src/subscriptionStore.js:75-77` |
| Email service | Servico de notificacao por e-mail | `server/src/app.js:25`; `server/src/emailService.js:1-90` |

## Ciclo de vida de uma requisicao

1. `buildApp` cria a instancia HTTP e decora dependencias compartilhadas (`server/src/app.js:15-25`).
2. Middlewares globais de CORS, JWT e rate limit sao registrados (`server/src/app.js:27-29`).
3. Plugins OAuth sao registrados condicionalmente por configuracao (`server/src/app.js:31-53`).
4. Modulos de rota sao registrados (`server/src/app.js:57-64`).
5. Rotas protegidas executam `preHandler` de autenticacao/autorizacao (`server/src/routes/sync.js:62-79`; `server/src/routes/admin.js:8-165`).
6. Handler de erro central registra severidade, mensagem e stack (`server/src/app.js:66-76`).

## Tratamento de erros

| Origem do erro | Estrategia | Ponto central | Evidencia |
|---|---|---|---|
| Erro nao tratado | Log estruturado e resposta com status derivado | Error handler Fastify | `server/src/app.js:66-76` |
| Validacao de e-mail | Resposta 400 com codigo especifico | Rota auth/members | `server/src/routes/auth.js:69`; `server/src/routes/members.js:51-56` |
| Papel invalido | Resposta 400 com papeis validos | Rota members | `server/src/routes/members.js:55-56`; `server/src/routes/members.js:131-132` |
| Billing nao configurado | Resposta 503 | Rota billing | `server/src/routes/billing.js:26`; `server/src/routes/billing.js:75` |
| Sem permissao owner | Resposta 403 | Rota billing portal | `server/src/routes/billing.js:85` |

## Pontos de extensao

| Ponto de extensao | O que permite estender | Como e registrado | Evidencia |
|---|---|---|---|
| Modulos de rota | Novos dominios HTTP | Import e `app.register` | `server/src/app.js:6-13`; `server/src/app.js:57-64` |
| Dependencias decoradas no app | Novos stores/servicos compartilhados | `app.decorate` | `server/src/app.js:18-25` |
| Migrations SQL | Evolucao de schema | Arquivos em `server/migrations/` | `server/migrations/001_init.sql:1`; `server/migrations/003_saas_base.sql:2` |

## Convencoes de log e correlacao

O servidor usa logger nativo da instancia HTTP (`server/src/app.js:16`) e o handler central emite campos de severidade, mensagem e stack (`server/src/app.js:66-76`). Identificador de correlacao por requisicao nao foi identificado: `// CARENCIA: nao identificado no codigo`.
