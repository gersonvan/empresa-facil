title: Task - UX UI Agent - Tela Projecao de Fluxo de Caixa
owner: ux-ui-agent
priority: P1
status: pending
date: 2026-05-24

Objetivo
- Entregar a tela Projecao de Fluxo de Caixa com leitura rapida de comprometimento futuro.

Escopo tecnico
1. Criar src/screens/CashFlowProjection.tsx com:
	- filtro de horizonte (3, 6, 12)
	- filtro de costType (empresa/pessoal)
	- cards de resumo
	- tabela mensal (mes, fixas, parceladas, total)
	- destaque visual para mes de pico
2. Criar src/screens/CashFlowProjection.module.css responsivo (mobile e desktop).
3. Integrar entrada de menu em src/components/NavBar.tsx.
4. Ajustar estilos de menu em src/components/NavBar.module.css se necessario.

Arquivos alvo
- src/screens/CashFlowProjection.tsx (novo)
- src/screens/CashFlowProjection.module.css (novo)
- src/components/NavBar.tsx (existente)
- src/components/NavBar.module.css (existente)

Criterios de aceite
1. Tela legivel em mobile e desktop.
2. Totais renderizados a partir do motor, sem recalculo duplicado na UI.
3. Novo item de menu com estado ativo correto.

Dependencia
- Consumir API final de projection.ts definida por calculation-agent.

Fora de escopo
- Integracoes de importacao automatica.
- Simulador avancado de cenarios.

Saida esperada no report
- Captura dos componentes criados.
- Estados de filtro suportados.
- Evidencia de validacao visual e build.

