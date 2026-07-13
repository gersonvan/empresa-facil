# Infraestrutura e implantacao

## Estado de producao em 2026-07-12

| Componente | Plataforma ativa | Endereco | Situacao |
|---|---|---|---|
| Frontend | Vercel Hobby | `https://empresafacil.gersonvan.com.br` | Ativo, com deploy automatico pelo branch `main` |
| API | Render Free | `https://empresafacil-api.onrender.com` | Ativa; plano gratuito pode hibernar por inatividade |
| Banco PostgreSQL | Supabase Free, Sao Paulo | Projeto `empresafacil-prod` | Ativo; dados migrados do Cloud SQL |
| Legado GCP | Cloud Run, Cloud SQL e Cloud Storage | Projeto `x-object-496819-e3` | Desativado de forma reversivel; recursos e dados foram preservados |

O frontend usa `VITE_API_URL` para consumir a API do Render. A API usa o pooler do Supabase e expoe `/health` e `/ready` para verificacoes operacionais.

> Segredos, URLs completas de conexao e credenciais nao devem ser versionados nesta documentacao nem no repositorio.

## Topologia de implantacao

| Componente implantavel | Replicas | Categoria | Regiao | Dependencias externas | Evidencia |
|---|---:|---|---|---|---|
| Frontend estatico | `// CARENCIA` | Container web estatico | `// CARENCIA` | Backend HTTP | `Dockerfile:1-14`; `deploy/nginx.conf` |
| Backend HTTP | `// CARENCIA` | Container Node | `// CARENCIA` | Banco, SMTP, OAuth, Stripe | `server/Dockerfile:1-6`; `render.yaml:1-23` |
| Banco relacional local | 1 no compose local | PostgreSQL | Local | Volume Docker | `docker-compose.yml:20-30` |

## Recursos de plataforma

| Categoria | Funcao | Evidencia |
|---|---|---|
| Container frontend | Build e servico estatico | `Dockerfile:1-14` |
| Container backend | Runtime do backend | `server/Dockerfile:1-6` |
| Compose local | Banco e backend local | `docker-compose.yml:20-30` |
| Pipeline cloud legado | Build/deploy frontend e backend no GCP | `cloudbuild.yaml:2-64` |
| Blueprint PaaS | Deploy backend alternativo | `render.yaml:1-53` |
| Configuracao Vercel | Frontend Vite como servico unico e rotas SPA | `vercel.json` |

## Pipeline ativo

| Etapa | Disparo | Pre-condicao | Artefato/Ambiente | Evidencia |
|---|---|---|---|---|
| API Render | Push em `main` | Repositorio GitHub conectado | Build em `server/` e deploy do servico `empresafacil-api` | `render.yaml:1-53` |
| Frontend Vercel | Push em `main` | Repositorio GitHub conectado e `VITE_API_URL` configurada | Build Vite e deploy de `dist/` | `vercel.json`; `package.json:7-8` |
| Dominio | DNS A `empresafacil` para `76.76.21.21` | Alias da Vercel para o deploy de producao | `empresafacil.gersonvan.com.br` | Configuracao externa da Vercel/Locaweb |

## Legado GCP e reversao

O ambiente anterior foi mantido sem exclusao para permitir reversao, mas nao deve atender trafego normal:

- O acesso publico da API Cloud Run `empresafacil-api` foi removido.
- O bucket `gs://empresafacil.gersonvan.com.br` deixou de permitir leitura por `allUsers`.
- A instancia Cloud SQL `empresafacil-pg` foi parada com politica de ativacao `never`.
- Os demais servicos Cloud Run antigos permanecem preservados e sem exposicao publica identificada.

Para reverter, primeiro restaure o acesso/servicos no GCP e somente depois repointe o DNS. Nao altere o DNS antes de uma verificacao funcional do ambiente de retorno.

## Estrategia de implantacao

O projeto possui definicoes para containerizar frontend e backend (`Dockerfile:1-14`; `server/Dockerfile:1-6`) e arquivos de plataforma (`cloudbuild.yaml:2-64`; `render.yaml:1-53`). A estrategia formal de canario, azul-verde ou rollback automatico nao foi identificada: `// CARENCIA: nao identificado no codigo`.

## Observabilidade em producao

| Sinal | Conteudo | Destino | Evidencia |
|---|---|---|---|
| Log de erro backend | Severidade, mensagem e stack | Logger do servidor/plataforma | `server/src/app.js:66-76` |
| Healthcheck | Status basico | Endpoint HTTP | `server/src/routes/health.js:2` |
| Readiness | Prontidao | Endpoint HTTP | `server/src/routes/health.js:11` |

## Retorno seguro a versao anterior

`// CARENCIA: nao identificado no codigo`. Nao ha procedimento versionado de rollback, politica de reversao de migrations ou estrategia automatizada de retorno seguro documentada em manifesto de infraestrutura.
