title: Task - UX UI Agent - Revisao de deducoes previstas e reconciliacao
owner: ux-ui-agent
priority: P1
status: pending
date: 2026-05-25

Objetivo
- Entregar as interfaces operacionais para revisar deducoes previstas automaticas e reconciliar previsto vs real no fechamento mensal.

Escopo tecnico
1. Criar src/screens/DeductionReview.tsx com:
	- filtros por mes, status, faixa e origem
	- tabela de itens previstos com receita vinculada
	- acoes por item: aprovar, rejeitar, editar
2. Criar src/screens/DeductionReview.module.css responsivo (mobile e desktop).
3. Integrar card de reconciliacao em src/screens/MonthReview.tsx:
	- total previsto
	- total real
	- diferenca
	- acao de gerar ajuste
4. Integrar rota e menu para area de revisao (router/nav).
5. Exibir mensagens de transparencia contabil no fluxo de revisao.

Arquivos alvo
- src/screens/DeductionReview.tsx (novo)
- src/screens/DeductionReview.module.css (novo)
- src/screens/MonthReview.tsx (existente)
- src/router.tsx (existente)
- src/components/NavBar.tsx (existente)

Criterios de aceite
1. Usuario revisa item previsto sem sair da tela.
2. Reconciliacao mensal mostra previsto vs real e diferenca de forma clara.
3. Fluxo legivel em mobile e desktop.
4. UI consome dados do motor/store sem recalculo fiscal duplicado na tela.

Dependencia
- Consumir contratos de estimationSnapshot/reviewStatus definidos por application-agent.
- Consumir valores previstos calculados pelo calculation-agent.

Fora de escopo
- Cadastro de perfil tributario e faixas (camada de dados).
- Integracoes externas de importacao fiscal.

Saida esperada no report
- Lista dos componentes/telas criados.
- Estados de filtro e acoes de revisao implementados.
- Evidencia de validacao visual, build e testes relevantes.

Plano de testes do especialista
1. Interface: filtros alteram lista corretamente.
2. Interface: aprovar/rejeitar/editar muda status exibido.
3. Interface: card de reconciliacao calcula diferenca prevista vs real.
4. Responsividade: validacao em viewport mobile e desktop.

