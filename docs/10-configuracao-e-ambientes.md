# Configuracao e ambientes

## Inventario de variaveis de ambiente

| Variavel | Proposito | Valor padrao | Obrigatoria | Ambientes | Evidencia |
|---|---|---|---|---|---|
| `VITE_API_URL` | URL base do backend para frontend | `http://localhost:3333` | Nao | dev/prod | `.env.example:1-4`; `src/config.ts:1`; `cloudbuild.yaml:46` |
| `PORT` | Porta do backend | `3333` | Nao | dev/prod | `server/src/config.js:12`; `docker-compose.yml:28`; `render.yaml:16` |
| `HOST` | Host bind do backend | `0.0.0.0` | Nao | dev/prod | `server/src/config.js:13`; `docker-compose.yml:29`; `render.yaml:18` |
| `DATABASE_URL` | Conexao PostgreSQL | vazio | Sim | dev/prod | `server/src/config.js:14`; `server/src/db.js:5`; `docker-compose.yml:30`; `render.yaml:21` |
| `SYNC_PULL_LIMIT` | Limite de eventos por pull | `500` | Nao | dev/prod | `server/src/config.js:15` |
| `JWT_SECRET` | Segredo de assinatura JWT | `dev-secret-troque-em-producao` | Sim em prod | dev/prod | `server/src/config.js:16`; `render.yaml:23` |
| `GOOGLE_CLIENT_ID` | Client id OAuth Google | vazio | Nao | prod se Google ativo | `server/src/config.js:17` |
| `GOOGLE_CLIENT_SECRET` | Client secret OAuth Google | vazio | Nao | prod se Google ativo | `server/src/config.js:18` |
| `MICROSOFT_CLIENT_ID` | Client id OAuth Microsoft | vazio | Nao | prod se Microsoft ativo | `server/src/config.js:19` |
| `MICROSOFT_CLIENT_SECRET` | Client secret OAuth Microsoft | vazio | Nao | prod se Microsoft ativo | `server/src/config.js:20` |
| `BACKEND_URL` | URL publica do backend para callbacks | `http://localhost:3333` | Nao | dev/prod | `server/src/config.js:21` |
| `FRONTEND_URL` | URL publica do frontend | `http://localhost:5173` | Nao | dev/prod | `server/src/config.js:22` |
| `SMTP_HOST` | Host SMTP | vazio | Nao | prod se e-mail ativo | `server/src/config.js:23` |
| `SMTP_PORT` | Porta SMTP | `587` | Nao | prod se e-mail ativo | `server/src/config.js:24` |
| `SMTP_USER` | Usuario SMTP | vazio | Nao | prod se e-mail ativo | `server/src/config.js:25` |
| `SMTP_PASS` | Senha SMTP | vazio | Nao | prod se e-mail ativo | `server/src/config.js:26` |
| `SMTP_FROM` | Remetente padrao | `EmpresaFacil <noreply@empresafacil.app>` | Nao | dev/prod | `server/src/config.js:27` |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe | vazio | Nao | prod se billing ativo | `server/src/config.js:28` |
| `STRIPE_WEBHOOK_SECRET` | Segredo webhook Stripe | vazio | Nao | prod se webhook ativo | `server/src/config.js:29` |
| `STRIPE_PRICE_PRO` | Price id plano Pro | vazio | Nao | prod se billing ativo | `server/src/config.js:30` |
| `STRIPE_PRICE_BUSINESS` | Price id plano Business | vazio | Nao | prod se billing ativo | `server/src/config.js:31`; `render.yaml:53` |

## Perfis de execucao

| Perfil | Modo de ativacao | Arquivos | Evidencia |
|---|---|---|---|
| Desenvolvimento frontend | `npm run dev` | `package.json`, `.env.example` | `package.json:7`; `.env.example:1-4` |
| Build frontend | `npm run build` | `package.json`, `vite.config.ts` | `package.json:8`; `vite.config.ts` |
| Desenvolvimento backend | `npm run dev` em `server/` | `server/package.json` | `server/package.json:7` |
| Producao backend | `npm run start` em `server/` | `server/package.json`, `server/Dockerfile`, `render.yaml` | `server/package.json:8`; `server/Dockerfile:6`; `render.yaml:1-23` |
| Docker local | `docker compose` | `docker-compose.yml` | `docker-compose.yml:20-30` |

## Arquivos de configuracao

| Caminho | Funcao | Escopo | Ambiente | Evidencia |
|---|---|---|---|---|
| `.env.example` | Exemplo de URL do backend para frontend | Frontend | dev/prod | `.env.example:1-4` |
| `src/config.ts` | Resolve URL base do backend | Frontend | dev/prod | `src/config.ts:1` |
| `server/src/config.js` | Carrega variaveis backend | Backend | dev/prod | `server/src/config.js:10-31` |
| `docker-compose.yml` | Sobe backend e banco local | Infra | dev | `docker-compose.yml:20-30` |
| `render.yaml` | Blueprint de deploy backend | Infra | prod | `render.yaml:1-53` |
| `cloudbuild.yaml` | Pipeline de build/deploy | Infra | prod | `cloudbuild.yaml:2-64` |

## Segredos

| Categoria de segredo | Origem | Mecanismo de injecao | Evidencia |
|---|---|---|---|
| Banco | Variavel de ambiente | `DATABASE_URL` | `server/src/config.js:14`; `server/src/db.js:5` |
| JWT | Variavel de ambiente | `JWT_SECRET` | `server/src/config.js:16` |
| OAuth | Variaveis de ambiente | `GOOGLE_*`, `MICROSOFT_*` | `server/src/config.js:17-20` |
| SMTP | Variaveis de ambiente | `SMTP_*` | `server/src/config.js:23-27` |
| Stripe | Variaveis de ambiente | `STRIPE_*` | `server/src/config.js:28-31` |

## Validacao de configuracao na inicializacao

O banco falha rapido quando `DATABASE_URL` nao existe (`server/src/db.js:5`). Outras variaveis possuem defaults ou vazio em `server/src/config.js:12-31`; schema formal de validacao nao foi identificado: `// CARENCIA: nao identificado no codigo`.
