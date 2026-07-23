# Frontend

## Estrategia de renderizacao

A camada de apresentacao usa renderizacao no cliente: o ponto de entrada monta a aplicacao no navegador e as rotas sao declaradas em codigo. A estrategia e evidenciada pelo script `dev`/`build` do Vite (`package.json:7-8`) e pelo roteamento em `src/App.tsx:17-64` e `src/router.tsx:21-36`.

## Roteamento

| Caminho | Tela ou pagina | Autenticacao | Evidencia |
|---|---|---|---|
| `/login` | Login | Nao | `src/App.tsx:18` |
| `/privacidade` | Privacidade | Nao | `src/App.tsx:19` |
| `/termos` | Termos | Nao | `src/App.tsx:20` |
| `/auth/callback` | Callback auth | Nao | `src/App.tsx:21` |
| `/onboarding` | Onboarding | Sim | `src/App.tsx:22` |
| `/admin` | Admin dashboard | Admin | `src/App.tsx:25-34` |
| `/admin/companies/:companyId` | Admin empresa | Admin | `src/App.tsx:35-44` |
| `/admin/users` | Admin usuarios | Admin | `src/App.tsx:45-53` |
| `/dashboard` | Dashboard | Sim | `src/router.tsx:22` |
| `/launch` | Lancar | Sim | `src/router.tsx:23` |
| `/import-ofx` | Importacao de OFX/CSV, perfis bancarios e memoria de categorizacao | Sim | `src/router.tsx:24`; `src/screens/ImportOFX.tsx` |
| `/import-review` | Fila mensal para aprovar importados ou excluir transferencias internas da DRE | Sim | `src/router.tsx`; `src/screens/ImportReview.tsx` |
| `/dre` | DRE | Sim | `src/router.tsx:25` |
| `/records` | Registros | Sim | `src/router.tsx:26` |
| `/companies` | Empresas | Sim | `src/router.tsx:27` |
| `/tax-profile` | Perfil tributario | Sim | `src/router.tsx:28` |
| `/members` | Membros | Sim | `src/router.tsx:29` |
| `/categories` | Categorias | Sim | `src/router.tsx:30` |
| `/chart-of-accounts` | Plano de contas | Sim | `src/router.tsx:31` |
| `/category-insights` | Insights de categoria | Sim | `src/router.tsx:32` |
| `/cash-flow-projection` | Previsao de caixa | Sim | `src/router.tsx:33` |
| `/deduction-review` | Revisao de deducoes | Sim | `src/router.tsx:34` |
| `/month-review` | Revisao do mes | Sim | `src/router.tsx:35` |
| `/training` | Treinamento | Sim | `src/router.tsx:36` |

## Composicao de telas

| Tela | Componentes principais | Fonte de dados | Evidencia |
|---|---|---|---|
| Shell protegido | `RequireAuth`, `Shell`, `AppRouter` | Token local e rotas internas | `src/App.tsx:56-64` |
| Admin | `RequireAdmin`, `Shell`, telas admin | API `/auth/me` e rotas admin | `src/App.tsx:24-53`; `src/components/RequireAdmin.tsx:19-20` |
| Rotas operacionais | Telas de `src/screens` | Stores locais e API | `src/router.tsx:2-16`; `src/router.tsx:21-36` |

## Padrao de gerencia de estado

O frontend usa combinacao de estado local em `localStorage`, stores por dominio e chamadas HTTP manuais. O token fica em `src/authStore.ts:3-16`; empresas usam `localStorage` e evento de empresa ativa (`src/companyStore.ts:21-86`; `src/companyStore.ts:498`); ciclo mensal usa storage local (`src/monthLifecycle.js:22-31`). Os perfis de importacao, memoria de categorizacao e historico de revisao tambem sao separados por `companyId` no armazenamento local e incluidos na fila de snapshots do `syncClient`, que os persiste no event store do backend (`src/importProfileStore.ts`; `src/transactionMemoryStore.ts`; `src/launchReviewHistoryStore.ts`; `src/syncClient.ts`).

## Integracao com a interface externa

A URL base do backend e centralizada em `API_URL` com fallback local (`src/config.ts:1`). Chamadas autenticadas usam bearer token, como na checagem admin (`src/components/RequireAdmin.tsx:19-20`). A lista completa de endpoints esta em `07-interface-externa.md`.

## Acessibilidade e suporte a dispositivos

O projeto usa CSS modules por componente/tela e shell responsivo, mas uma politica formal de acessibilidade nao foi localizada em codigo: `// CARENCIA: nao identificado no codigo`. O suporte responsive e requisito de projeto em `AGENTS.md`, mas esta secao PADTec considera codigo-fonte como fonte primaria.
