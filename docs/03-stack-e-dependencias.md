# Stack tecnologico e dependencias

As versoes abaixo usam os manifestos e lockfiles do repositorio. Quando o manifesto declara range, o range e citado literalmente e a versao resolvida vem do lockfile.

## Inventario por camada

| Camada | Categoria | Nome | Versao resolvida | Range no manifesto | Evidencia |
|---|---|---|---|---|---|
| Frontend | Framework UI | React | 18.3.1 | `^18.3.1` | `package.json:16`; `package-lock.json:12` |
| Frontend | Renderizacao DOM | React DOM | 18.3.1 | `^18.3.1` | `package.json:17`; `package-lock.json:13` |
| Frontend | Roteamento | React Router DOM | 6.26.0 | `^6.26.0` | `package.json:18`; `package-lock.json:14` |
| Frontend | Build tool | Vite | 5.4.21 | `^5.4.0` | `package.json:28`; `package-lock.json:3826` |
| Frontend | Linguagem | TypeScript | 5.5.4 | `^5.5.3` | `package.json:27`; `package-lock.json:23` |
| Frontend | PDF | jsPDF | 4.2.1 | `^4.2.1` | `package.json:15` |
| Backend | Servidor HTTP | Fastify | 4.28.1 | `^4.28.1` | `server/package.json:18` |
| Backend | CORS | @fastify/cors | 9.0.1 | `^9.0.1` | `server/package.json:13`; `server/package-lock.json:11` |
| Backend | JWT | @fastify/jwt | 8.0.1 | `^8.0.1` | `server/package.json:14`; `server/package-lock.json:12` |
| Backend | OAuth | @fastify/oauth2 | 7.9.0 | `^7.9.0` | `server/package.json:15`; `server/package-lock.json:13` |
| Backend | Rate limit | @fastify/rate-limit | 9.1.0 | `^9.1.0` | `server/package.json:16`; `server/package-lock.json:14` |
| Backend | Banco | pg | 8.13.1 | `^8.13.1` | `server/package.json:20`; `server/package-lock.json:1120` |
| Backend | E-mail | nodemailer | 8.0.10 | `^8.0.10` | `server/package.json:19`; `server/package-lock.json:962-964` |
| Backend | Pagamentos | stripe | 22.2.0 | `^22.2.0` | `server/package.json:21`; `server/package-lock.json:1487` |
| Backend/teste | Banco em memoria | pg-mem | 3.0.5 | `^3.0.5` | `server/package.json:24` |

## Dependencias de desenvolvimento

| Nome | Versao resolvida | Proposito | Evidencia |
|---|---|---|---|
| Vitest | 4.1.7 | Testes de UI | `package.json:29` |
| jsdom | 29.1.1 | Ambiente DOM em testes | `package.json:26` |
| Testing Library React | 16.3.2 | Testes de componentes | `package.json:22` |
| pg-mem | 3.0.5 | Testes de migrations/backend | `server/package.json:24` |

## Servicos de plataforma

| Categoria | Funcao no sistema | Modo de consumo | Evidencia |
|---|---|---|---|
| Banco relacional | Persistencia do backend | `DATABASE_URL` e cliente `pg` | `server/src/config.js:14`; `server/package.json:20` |
| Identidade federada | Login via provedores externos | OAuth2 | `server/src/app.js:31-53`; `server/src/routes/auth.js:9-47` |
| SMTP | Envio de magic link e convites | Nodemailer | `server/src/config.js:23-27`; `server/src/emailService.js:1-90` |
| Pagamento | Checkout, portal e webhooks | SDK Stripe | `server/src/routes/billing.js:1-201`; `server/package.json:21` |

## Politica de atualizacao

`// CARENCIA: nao identificado no codigo`. O repositorio contem lockfiles (`package-lock.json`, `server/package-lock.json`) e ranges nos manifestos, mas nao foi identificado arquivo de politica de atualizacao automatizada ou rotina de revisao de dependencias.
