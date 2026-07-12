# Infraestrutura e implantacao

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
| Pipeline cloud | Build/deploy frontend e backend | `cloudbuild.yaml:2-64` |
| Blueprint PaaS | Deploy backend alternativo | `render.yaml:1-53` |

## Pipeline

| Etapa | Disparo | Pre-condicao | Artefato/Ambiente | Evidencia |
|---|---|---|---|---|
| Build backend | Pipeline cloud | Dockerfile backend | Imagem backend | `cloudbuild.yaml:2-6`; `server/Dockerfile:1-6` |
| Build frontend | Pipeline cloud | `npm install` e `npm run build` | `dist/` | `cloudbuild.yaml:46`; `Dockerfile:6-14` |
| Deploy frontend | Pipeline cloud | Build frontend concluido | Arquivos estaticos | `cloudbuild.yaml:64` |
| Deploy backend Render | Blueprint | `npm ci --omit=dev` | Servico backend | `render.yaml:9` |

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
