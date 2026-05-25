title: MVP Estimativa Automatica de Deducoes - Kickoff por especialistas
date: 2026-05-25
status: active

Objetivo
- Entregar o MVP generico de deducoes previstas automaticas para receitas empresariais, com base em faixas de faturamento anual e reconciliacao mensal.

Escopo desta rodada
- Fase 1 (P0): dados base + motor de estimativa + testes de regressao.
- Fase 2 (P1): revisao operacional e reconciliacao mensal.

Distribuicao de responsabilidade
- calculation-agent: motor de estimativa, idempotencia e suite de testes de calculo.
- application-agent: stores/configuracao fiscal por empresa e integracao no fluxo de lancamentos.
- ux-ui-agent: experiencia de revisao de deducoes previstas e reconciliacao no fechamento mensal.

Regras operacionais
- Nao quebrar fluxos atuais de lancamentos, DRE, projecao e revisao mensal.
- Preservar separacao company/personal em todo write path.
- Aplicar automacao somente para receita empresarial elegivel e mes aberto.
- Deducao criada automaticamente deve manter vinculo explicito com a receita de origem.
- Toda estimativa deve carregar aviso de validacao contabil e trilha de auditoria.

Dependencias
- calculation-agent depende do contrato de dados de perfil/faixa entregue por application-agent.
- ux-ui-agent depende dos metadados de estimativa e status de revisao entregues por application-agent.
- reconciliacao de UX depende de snapshot/versionamento de formula entregue por calculation-agent.

Criterios de aceite globais
- Receita empresarial elegivel gera deducao prevista automaticamente com formula versionada.
- Nao ha duplicidade de deducao prevista para a mesma receita vinculada.
- Edicao/remocao da receita atualiza ou remove a deducao vinculada.
- Mes fechado bloqueia geracao e alteracoes automaticas.
- Reconciliacao mensal permite comparar previsto vs real e gerar ajuste.

Entregaveis de retorno
- Cada agente preenche seu report.md com:
	1. Arquivos alterados
	2. Decisoes tecnicas
	3. Testes executados e resultado
	4. Riscos remanescentes

Matriz de testes obrigatoria desta rodada
1. Unitarios de calculo: formula, faixa, arredondamento, idempotencia e recalculo.
2. Integracao de store: normalizacao, retrocompatibilidade e bloqueio de mes fechado.
3. Fluxo operacional: revisao de item previsto e reconciliacao mensal com ajuste.

