# Estrutura do projeto

## Arvore de diretorios de primeiro nivel

| Diretorio | Proposito | Tipo | Evidencia |
|---|---|---|---|
| `.apm/` | Historico e plano de execucao APM | Documentacao/processo | `.apm/tracker.md` |
| `.github/` | Regras e materiais auxiliares de engenharia | Configuracao | `.github/` |
| `deploy/` | Configuracao do servidor estatico do frontend | Infraestrutura | `Dockerfile:13` |
| `design/` | Artefatos de design/prototipos | Documentacao | `design/` |
| `docs/` | Documentacao de produto e tecnica | Documentacao | `docs/` |
| `padtec/` | Framework local de documentacao tecnica | Documentacao/automacao | `padtec/README.md` |
| `public/` | Ativos publicos do frontend | Codigo/asset | `public/` |
| `scripts/` | Automacoes locais | Automacao | `package.json:12` |
| `server/` | Backend HTTP, migrations e testes | Codigo | `server/package.json:6-10` |
| `src/` | Frontend, dominio client-side e telas | Codigo | `src/App.tsx:1-68`; `src/router.tsx:1-39` |
| `tests/` | Testes do dominio/frontend | Teste | `package.json:10-11` |

## Convencoes de nomenclatura

| Tipo | Padrao | Evidencia |
|---|---|---|
| Telas frontend | Componentes em `src/screens/<Nome>.tsx` com CSS module pareado | `src/router.tsx:2-16`; `src/screens/Dashboard.tsx` |
| Componentes compartilhados | Componentes em `src/components/` e `src/components/ui/` | `src/App.tsx:2-4`; `src/components/Shell.tsx` |
| Stores frontend | Arquivos `*Store.ts` ou `*Store.js` | `src/companyStore.ts:1`; `src/authStore.ts:1`; `src/monthLifecycle.js:207` |
| Rotas backend | Arquivos em `server/src/routes/*.js` exportando modulo de rotas | `server/src/app.js:6-13`; `server/src/app.js:57-64` |
| Stores backend | Arquivos `*Store.js` decorados no app | `server/src/app.js:20-24` |
| Migrations | Arquivos SQL incrementais em `server/migrations/NNN_nome.sql` | `server/migrations/001_init.sql:1`; `server/migrations/002_auth.sql:1`; `server/migrations/003_saas_base.sql:2` |

## Padrao de modulo

O frontend usa roteamento declarado em codigo: `src/App.tsx` define rotas publicas, admin e shell protegido (`src/App.tsx:17-64`), enquanto `src/router.tsx` define as telas internas (`src/router.tsx:21-36`). O backend usa composicao por plugins/rotas: `server/src/app.js` importa modulos de rota (`server/src/app.js:6-13`) e os registra em sequencia (`server/src/app.js:57-64`).

## Regras de fronteira

| Regra | Aplicacao automatizada | Evidencia |
|---|---|---|
| Frontend chama backend pela URL base `VITE_API_URL` | Sim, por configuracao central | `src/config.ts:1` |
| Rotas internas exigem autenticacao no wrapper principal | Sim, por composicao de rota | `src/App.tsx:56-64` |
| Rotas admin exigem wrapper admin | Sim, por composicao de rota | `src/App.tsx:24-53` |
| Backend exige JWT para rotas marcadas com `requireAuth` | Sim, por `preHandler` | `server/src/routes/sync.js:62-79`; `server/src/routes/members.js:10-127` |
| Regra automatizada de lint/import boundaries | Nao identificado | `// CARENCIA: nao identificado no codigo` |

## Arquivos sensiveis e pontos de entrada

| Arquivo | Funcao | Risco de modificacao | Evidencia |
|---|---|---|---|
| `src/main.tsx` | Entrada do frontend | Quebra inicializacao da SPA | `src/main.tsx` |
| `src/App.tsx` | Roteamento publico/protegido/admin | Pode expor ou bloquear telas | `src/App.tsx:17-64` |
| `src/router.tsx` | Roteamento interno | Pode remover fluxos operacionais | `src/router.tsx:21-36` |
| `server/src/server.js` | Entrada do backend | Pode impedir subida do servidor | `server/package.json:8` |
| `server/src/app.js` | Composicao do backend | Pode remover middlewares/rotas | `server/src/app.js:15-64` |
| `server/src/config.js` | Variaveis e defaults | Pode alterar seguranca/conexao | `server/src/config.js:10-31` |
| `server/migrations/*.sql` | Schema persistente | Pode causar drift ou perda de compatibilidade | `server/migrations/001_init.sql:1`; `server/migrations/002_auth.sql:1`; `server/migrations/003_saas_base.sql:2` |
