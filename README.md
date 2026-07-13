# EmpresaFacil

EmpresaFacil e uma aplicacao web full-stack para controle financeiro de pequenos negocios. O frontend fica na raiz do projeto e usa os scripts `dev`, `build`, `preview` e `test` definidos em `package.json:6-12`; o backend fica em `server/` e expoe servidor de sincronizacao, autenticacao, membros, onboarding, administracao e billing pelos scripts de `server/package.json:6-10`.

## Producao

- Aplicacao: `https://empresafacil.gersonvan.com.br`
- API: `https://empresafacil-api.onrender.com/health`
- Banco: Supabase (projeto `empresafacil-prod`, regiao Sao Paulo)

O frontend e publicado na Vercel e a API no Render, ambos a partir de `main`. O ambiente GCP anterior esta preservado, porem desativado de forma reversivel. Consulte `docs/11-infraestrutura-e-deployment.md` e `docs/operacao-producao.md` antes de qualquer alteracao de infraestrutura.

## Documentacao tecnica

A documentacao tecnica reversa gerada pelo PADTec esta em `docs/`:

- `docs/01-visao-geral.md`
- `docs/02-arquitetura.md`
- `docs/03-stack-e-dependencias.md`
- `docs/04-estrutura-do-projeto.md`
- `docs/05-modelo-de-dominio.md`
- `docs/06-fluxos-de-negocio.md`
- `docs/07-interface-externa.md`
- `docs/08-frontend.md`
- `docs/09-backend.md`
- `docs/10-configuracao-e-ambientes.md`
- `docs/11-infraestrutura-e-deployment.md`
- `docs/banco-de-dados.md`
- `docs/auth.md`
- `docs/integracoes-externas.md`
- `docs/notificacoes.md`
- `docs/multi-tenancy.md`
- `docs/operacao-producao.md`

## Comandos principais

Frontend:

```bash
npm install
npm run dev
npm test
npm run build
```

Backend:

```bash
cd server
npm install
npm run db:migrate
npm run dev
npm test
```

O backend requer `DATABASE_URL`; a ausencia dessa configuracao impede a inicializacao em `server/src/db.js:5`.
