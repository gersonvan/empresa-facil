# Opcoes de migracao de infraestrutura

Data: 2026-07-09

## Contexto atual

O projeto esta configurado principalmente para GCP:

- Backend: imagem Docker buildada no Cloud Build, enviada ao Artifact Registry e publicada no Cloud Run `empresafacil-api` em `southamerica-east1` (`cloudbuild.yaml:3-31`).
- Frontend: build Vite com `VITE_API_URL` apontando para Cloud Run e deploy de `dist/` para o bucket `gs://empresafacil.gersonvan.com.br` (`cloudbuild.yaml:40-70`).
- Banco: o codigo usa `DATABASE_URL`; o repositorio nao prova se o banco atual e Cloud SQL, Supabase, Render, Neon ou outro provedor (`server/src/config.js:14`; `server/src/db.js:5`).
- Alternativa existente: ha um `render.yaml` para backend no Render, mas ele parece blueprint alternativo/legado, nao necessariamente a infra ativa (`render.yaml:1-54`).

## Criterios de decisao

| Criterio | Peso pratico | Observacao |
|---|---:|---|
| Menor esforco de migracao | Alto | Credito GCP expira em cerca de um mes. |
| Baixo custo fixo | Alto | Produto ainda deve evitar custo operacional desnecessario. |
| Banco gerenciado confiavel | Alto | O backend depende de PostgreSQL via `DATABASE_URL`. |
| Pouca reescrita de codigo | Alto | Backend atual e Fastify/Node, nao serverless-first. |
| Facilidade de rollback | Medio | Ideal manter GCP funcionando ate validar novo ambiente. |
| Consolidacao com stack existente | Medio | Usuario ja usa Vercel e Supabase em outros sistemas. |

## Cenarios comparados

### Cenario 1 - Vercel + Supabase + Render

```text
Vercel frontend
  -> Render backend Fastify
      -> Supabase Postgres
      -> Stripe / SMTP / OAuth
```

| Item | Avaliacao |
|---|---|
| Esforco | Medio |
| Custo previsivel | Medio |
| Reescrita | Baixa |
| Operacao | Boa |
| Risco | Medio |

Vantagens:

- Aproveita Vercel e Supabase, que ja fazem parte do seu ecossistema.
- Mantem o backend Fastify como servico web normal.
- Supabase resolve Postgres gerenciado sem precisar operar Cloud SQL.
- Vercel e uma boa substituicao para o frontend estatico em GCS.

Riscos/cuidados:

- Fica com tres fornecedores.
- Latencia entre Render e Supabase precisa ser observada.
- Variaveis de ambiente e callbacks OAuth/Stripe precisam ser revisados.

Uso recomendado:

- Melhor equilibrio para aproveitar o que voce ja usa sem reescrever backend.

### Cenario 2 - Render completo

```text
Render Static Site ou Vercel frontend
  -> Render backend Fastify
      -> Render Postgres
      -> Stripe / SMTP / OAuth
```

| Item | Avaliacao |
|---|---|
| Esforco | Baixo |
| Custo previsivel | Medio |
| Reescrita | Baixa |
| Operacao | Boa |
| Risco | Baixo/medio |

Vantagens:

- O repositorio ja tem `render.yaml`.
- Backend atual encaixa bem em Web Service.
- Postgres e backend podem ficar no mesmo provedor.
- Migração tecnica provavelmente mais rapida.

Riscos/cuidados:

- Render free nao deve ser usado para producao.
- Banco pago deve ser considerado desde o inicio.
- Frontend poderia ficar no Render ou na Vercel; decidir isso evita arquitetura hibrida desnecessaria.

Uso recomendado:

- Melhor opcao para migrar rapido antes do credito GCP expirar.

### Cenario 3 - Railway completo

```text
Vercel ou Railway frontend
  -> Railway backend Fastify
      -> Railway Postgres
      -> Stripe / SMTP / OAuth
```

| Item | Avaliacao |
|---|---|
| Esforco | Baixo |
| Custo previsivel | Medio/baixo no inicio |
| Reescrita | Baixa |
| Operacao | Muito simples |
| Risco | Medio |

Vantagens:

- Deploy simples por Git.
- Backend Node e Postgres encaixam bem.
- Boa opcao para MVP/produto pequeno.

Riscos/cuidados:

- Modelo usage-based exige budget alert.
- Pode ficar menos previsivel se trafego/uso crescer.
- Precisa validar backup/restore do Postgres e retencao.

Uso recomendado:

- Boa opcao se prioridade for velocidade e simplicidade operacional.

### Cenario 4 - Vercel + Supabase puro

```text
Vercel frontend
  -> Vercel/Supabase Functions
      -> Supabase Postgres/Auth
      -> Stripe / SMTP / OAuth
```

| Item | Avaliacao |
|---|---|
| Esforco | Alto |
| Custo previsivel | Medio |
| Reescrita | Alta |
| Operacao | Boa depois de migrado |
| Risco | Alto |

Vantagens:

- Consolida em fornecedores que voce ja usa.
- Supabase poderia assumir mais capacidades no futuro: auth, storage, edge functions.

Riscos/cuidados:

- Backend atual e Fastify; migrar para functions/serverless exige refatoracao.
- Risco alto para fazer em um mes sem regressao.
- Pode misturar migracao de infra com redesign arquitetural.

Uso recomendado:

- Nao recomendado como primeira migracao. Pode ser etapa futura.

### Cenario 5 - Cloudflare + banco externo

```text
Cloudflare Pages frontend
  -> Cloudflare Workers ou backend separado
      -> Supabase/Neon Postgres
```

| Item | Avaliacao |
|---|---|
| Esforco | Medio/alto |
| Custo previsivel | Baixo/medio |
| Reescrita | Media/alta |
| Operacao | Boa |
| Risco | Medio/alto |

Vantagens:

- Custo potencialmente baixo para frontend/edge.
- Boa performance global.

Riscos/cuidados:

- Fastify em Workers nao e migração direta.
- D1 nao e Postgres; trocar banco agora aumentaria escopo.
- Melhor usar banco externo se seguir por esse caminho.

Uso recomendado:

- Interessante no futuro, nao como caminho mais rapido.

## Recomendacao

### Melhor caminho geral

**Vercel + Supabase + Render**

Motivo: combina o que voce ja usa com baixa reescrita. O frontend sai do GCS para Vercel, o banco vai para Supabase Postgres e o backend Fastify roda como servico web no Render.

### Caminho mais rapido

**Render completo**

Motivo: o repo ja tem `render.yaml`, o backend ja esta pronto para Node service e o frontend pode ficar no Render ou Vercel.

### Caminho que eu evitaria agora

**Vercel + Supabase puro**

Motivo: parece atraente por consolidar, mas exige adaptar backend Fastify para functions/serverless ou reestruturar a API. Isso aumenta risco dentro da janela de um mes.

## Proximo passo tecnico

Executar uma auditoria curta de infra atual e preparar plano de migração para os dois cenarios finalistas:

1. Render completo.
2. Vercel + Supabase + Render.

Checklist da auditoria:

- Confirmar onde esta o PostgreSQL atual.
- Exportar lista de variaveis de ambiente do Cloud Run.
- Confirmar dominio frontend atual e DNS.
- Confirmar callbacks OAuth configurados.
- Confirmar webhooks Stripe ativos e URLs.
- Confirmar SMTP/remetente atual.
- Definir estrategia de backup e restore do banco.
- Fazer deploy paralelo em novo ambiente.
- Rodar smoke test.
- Trocar DNS apenas depois do ambiente novo validado.

## Decisao sugerida

Comecar pela auditoria de infra atual e, se nao houver dependencia escondida em GCP, montar primeiro um deploy paralelo:

```text
Vercel frontend teste
Render backend teste
Supabase Postgres teste
```

O ambiente GCP atual deve continuar ativo ate a validacao completa do novo ambiente.
