title: Task - Application Agent - Dados e Integracao
owner: application-agent
priority: P0-P1
status: pending
date: 2026-05-24

Objetivo
- Criar camada de dados de compromissos e integrar navegacao base da nova area.

Escopo tecnico
1. Criar src/commitmentStore.ts com CRUD e normalizacao:
	- tipos: fixed | installment
	- costType: company | personal
	- campos de vigencia e parcelas
2. Implementar versao de storage dedicada para compromissos.
3. Garantir leitura segura de dados incompletos (normalize).
4. Integrar rota base da nova tela em src/router.tsx.
5. Expor funcoes de listagem por mes/horizonte para consumo da UI.

Arquivos alvo
- src/commitmentStore.ts (novo)
- src/router.tsx (existente)

Criterios de aceite
1. CRUD funcional sem quebrar launchStore atual.
2. Dados invalidos nao derrubam leitura.
3. Rota da nova area registrada e acessivel.

Dependencia
- Alinhar formato de tipos com calculation-agent para evitar conversao extra.

Fora de escopo
- Estilizacao final de tela.
- Testes de interface.

Saida esperada no report
- Assinatura das funcoes publicas do store.
- Chave de storage e estrategia de normalizacao.
- Evidencia de build/teste apos integracao.

