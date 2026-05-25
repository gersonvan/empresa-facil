title: Report - Calculation Agent
owner: calculation-agent
status: completed-partial
date: 2026-05-25

Resumo de entrega
- Motor puro de estimativa de deducoes entregue para reaproveito no fluxo de lancamentos.
- Selecao de faixa, calculo, snapshot e formulaVersion encapsulados em modulo deterministico.
- Suite dedicada de testes adicionada para fronteiras, arredondamento e determinismo.

Arquivos alterados
- src/deductionEstimation.ts (novo)
- src/launchStore.ts
- tests/deduction-estimation.test.js (novo)
- package.json

Funcoes e contratos criados
1. selectDeductionBracket
2. calculateEstimatedDeduction
3. DEFAULT_DEDUCTION_FORMULA_VERSION
4. DeductionEstimationSnapshot e DeductionEstimationResult

Casos de teste cobertos
1. Selecao de faixa em limites de fronteira.
2. Formula e arredondamento monetario em 2 casas.
3. FormulaVersion default e custom.
4. Entradas invalidas (retorno nulo).
5. Determinismo por ordem de faixas.

Validacao
1. Build: aprovado.
2. Testes: aprovado com deduction-estimation incluso na suite npm test.

Riscos remanescentes
1. Integrar tela de revisao para status suggested/approved/rejected ainda pendente.
2. Reconciliacao mensal previsto vs real ainda pendente.

Handoff para manager
- Motor puro pronto para consumo do fluxo de revisao e conciliacao sem duplicar regra na UI.

