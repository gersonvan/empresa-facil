title: Task - Calculation Agent - Motor de estimativa de deducoes
owner: calculation-agent
priority: P0
status: pending
date: 2026-05-25

Objetivo
- Implementar motor deterministico para estimar deducoes previstas a partir de receita e faixa de faturamento anual.

Escopo tecnico
1. Criar src/deductionEstimation.ts com funcoes puras:
	- selecao de faixa por annualRevenueForecast
	- calculo de deducao prevista por aliquota estimada
	- snapshot de calculo com formulaVersion
2. Garantir arredondamento monetario deterministico.
3. Expor contrato de resultado para consumo do application-agent e ux-ui-agent.
4. Adicionar testes em tests/deduction-estimation.test.js cobrindo:
	- selecao de faixa em limites e fronteiras
	- formula basica e arredondamento
	- comportamento para receita invalida/negativa
	- consistencia de formulaVersion e snapshot
	- determinismo para mesma entrada

Arquivos alvo
- src/deductionEstimation.ts (novo)
- src/calculations.d.ts (existente, se necessario para tipos)
- tests/deduction-estimation.test.js (novo)
- package.json (script de testes, se necessario)

Criterios de aceite
1. Mesma entrada gera mesma deducao prevista (determinismo).
2. Selecao de faixa e formula sem ambiguidades em fronteiras.
3. Snapshot inclui formulaVersion e dados suficientes para auditoria.
4. Testes novos passando junto da suite existente.

Fora de escopo
- Integracoes fiscais externas.
- Politicas de IA para classificacao de casos ambiguos.

Saida esperada no report
- Lista de funcoes puras criadas e contratos retornados.
- Casos de borda de faixa/arredondamento cobertos.
- Resultado de testes e riscos residuais de formula.

Plano de testes do especialista
1. Unitario: faixa correta para cada fronteira.
2. Unitario: valor estimado e arredondamento em 2 casas.
3. Unitario: formulaVersion presente no snapshot.
4. Regressao: mesma entrada, mesma saida em multiplas execucoes.

