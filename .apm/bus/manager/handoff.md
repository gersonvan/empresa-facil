title: Projecao de Fluxo de Caixa - Kickoff por agentes
date: 2026-05-24
status: active

Objetivo
- Entregar o MVP da area Projecao de Fluxo de Caixa com foco em previsao de contas fixas e parcelamentos para 3, 6 e 12 meses.

Escopo desta rodada
- Fase 1 (P0): dados + motor + testes.
- Fase 2 parcial (P1): estrutura de tela e navegacao.

Distribuicao de responsabilidade
- calculation-agent: motor de projecao e cobertura de testes.
- application-agent: store de compromissos e integracao de rota.
- ux-ui-agent: tela de projecao, filtros, cards, tabela e entrada no menu.

Regras operacionais
- Nao quebrar fluxos atuais de lancamentos, DRE e revisao mensal.
- Preservar separacao company/personal em todo write path.
- Projetar somente para frente a partir do mes de referencia.
- Parcelamento nunca pode exceder total de parcelas.

Dependencias
- calculation-agent depende de contrato de tipos alinhado com application-agent.
- ux-ui-agent depende das funcoes de leitura de projecao entregues por calculation-agent.

Criterios de aceite globais
- Usuario consegue ver previsao mensal de fixas e parceladas para 3, 6 e 12 meses.
- Totais da tela batem com saida do motor de projecao.
- Testes de motor cobrem casos de borda principais.

Entregaveis de retorno
- Cada agente preenche seu report.md com:
	1. Arquivos alterados
	2. Decisoes tecnicas
	3. Testes executados e resultado
	4. Riscos remanescentes

