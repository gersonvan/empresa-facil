title: Task - Calculation Agent - Motor de Projecao
owner: calculation-agent
priority: P0
status: pending
date: 2026-05-24

Objetivo
- Implementar motor deterministico para projecao de contas fixas e parceladas por horizonte mensal.

Escopo tecnico
1. Criar arquivo src/projection.ts com:
	- gerador de horizonte mensal (3, 6, 12)
	- projecao de compromissos fixos ativos
	- projecao de compromissos parcelados com limite de parcelas
	- consolidacao mensal: fixed, installment, total
2. Expor tipos de saida reutilizaveis para UI.
3. Adicionar testes em tests/projection-engine.test.js cobrindo:
	- fixo sem data final
	- fixo com data final
	- parcelamento com parcelas restantes
	- parcelamento encerrado
	- consistencia de totais por horizonte

Arquivos alvo
- src/projection.ts (novo)
- tests/projection-engine.test.js (novo)
- package.json (script de testes, se necessario)

Criterios de aceite
1. Mesma entrada gera mesma saida (determinismo).
2. Parcelamento nao ultrapassa totalInstallments.
3. Testes novos passando junto da suite existente.

Fora de escopo
- Integracoes externas.
- Regras de IA para previsao.

Saida esperada no report
- Lista de funcoes criadas.
- Casos de borda cobertos.
- Resultado dos testes.

