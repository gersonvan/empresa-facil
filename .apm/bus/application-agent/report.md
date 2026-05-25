title: Report - Application Agent
owner: application-agent
status: completed-partial
date: 2026-05-25

Resumo de entrega
- Fase P0 iniciada para deducoes previstas automaticas com stores fiscais e integracao no fluxo de lancamentos.
- Geracao automatica de deducao prevista habilitada para receita empresarial em mes aberto, com vinculo origem-deducao.
- Idempotencia aplicada por linkedEntryId + sourceType tax_estimation + formulaVersion.

Arquivos alterados
- src/taxProfileStore.ts (novo)
- src/deductionBracketStore.ts (novo)
- src/launchStore.ts

Decisoes tecnicas
1. Perfil tributario por empresa em chave dedicada empresa-facil:tax-profile:v1.
2. Faixas de deducao em chave dedicada empresa-facil:deduction-brackets:v1 com defaults ate 1.000.000.
3. Automacao no launchStore restrita a receita empresarial e bloqueada para mes fechado.
4. Deducao automatica gravada com sourceType=tax_estimation, linkedEntryId e estimationSnapshot versionado.

Validacao
1. Build: aprovado.
2. Testes: aprovado (suite completa incluindo projection-engine).
3. Diagnosticos TypeScript dos arquivos alterados: sem erros.

Riscos remanescentes
1. Ainda falta tela de revisao operacional para aprovar/rejeitar deducoes sugeridas.
2. Ainda falta reconciliacao mensal previsto vs real com lancamento de ajuste.
3. Teste automatizado dedicado ao fluxo de estimativa em launchStore ainda pendente.

Handoff para manager
- Camada de dados P0 pronta para avancar com:
	1. motor dedicado (calculation-agent) para extrair formula para modulo puro
	2. interface de revisao/reconciliacao (ux-ui-agent)

