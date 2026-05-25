# Projecao de Fluxo de Caixa - Implementacao por Arquivo

## Objetivo
Traduzir o backlog para uma sequencia de implementacao objetiva, apontando arquivos exatos para cada task do MVP de Projecao de Fluxo de Caixa.

## Convencoes
1. Prioridade: P0 (essencial), P1 (importante), P2 (evolutivo).
2. Tipo de arquivo:
3. Existente: arquivo ja presente no projeto.
4. Novo: arquivo a criar.

## Fase 1 - P0 (dados e motor)

### Task A1 - Criar store de compromissos
1. Arquivo novo: src/commitmentStore.ts
2. Arquivo novo: src/commitmentStore.d.ts (opcional, se o padrao local exigir)
3. Arquivo existente: src/launchStore.ts
4. Acoes:
5. Implementar CRUD de compromissos com localStorage versionado.
6. Definir tipos base: fixed e installment.
7. Aplicar normalize para garantir retrocompatibilidade de leitura.
8. Reaproveitar padrao de validacao e persistencia usado em launchStore.
9. Criterio de pronto:
10. Store opera sem impactar o fluxo atual de lancamentos.

### Task A2 - Criar motor de projecao mensal
1. Arquivo novo: src/projection.ts
2. Arquivo existente: src/calculations.d.ts
3. Arquivo existente: src/contracts.d.ts
4. Acoes:
5. Implementar gerador de horizonte (3, 6, 12 meses).
6. Implementar regra de fixas (recorrencia mensal ativa).
7. Implementar regra de parceladas (apenas parcelas restantes).
8. Consolidar totais mensais: fixed, installment, total.
9. Criterio de pronto:
10. Funcoes deterministicas para mesmos dados de entrada.

### Task A3 - Cobertura de testes do motor
1. Arquivo novo: tests/projection-engine.test.js
2. Arquivo existente: tests/core-model.test.js
3. Arquivo existente: package.json
4. Acoes:
5. Adicionar cenarios de borda: inicio/fim de vigencia, parcelamento encerrado, horizonte reduzido.
6. Incluir execucao do novo teste no script de test.
7. Criterio de pronto:
8. Suite verde com cenarios de fixas e parceladas.

## Fase 2 - P1 (tela e navegacao)

### Task B1 - Criar tela Projecao de Fluxo de Caixa
1. Arquivo novo: src/screens/CashFlowProjection.tsx
2. Arquivo novo: src/screens/CashFlowProjection.module.css
3. Arquivo existente: src/screens/Dashboard.tsx
4. Acoes:
5. Montar cabecalho, filtros e cards de resumo.
6. Exibir tabela mensal com colunas mes, fixas, parceladas e total.
7. Destacar mes com maior comprometimento.
8. Adicionar atalho no Dashboard para a nova tela.
9. Criterio de pronto:
10. Tela responsiva em mobile e desktop.

### Task B2 - Integrar rota
1. Arquivo existente: src/router.tsx
2. Acoes:
3. Registrar rota /cash-flow-projection.
4. Criterio de pronto:
5. Navegacao direta via URL e menu funcionando.

### Task B3 - Integrar menu
1. Arquivo existente: src/components/NavBar.tsx
2. Arquivo existente: src/components/NavBar.module.css
3. Acoes:
4. Adicionar item Projecao no conjunto principal de navegacao.
5. Ajustar espacamento do menu, se necessario.
6. Criterio de pronto:
7. Novo item com estado ativo consistente.

## Fase 3 - P1 (operacao)

### Task C1 - Cadastro rapido de conta fixa
1. Arquivo novo: src/components/CommitmentFormFixed.tsx
2. Arquivo existente: src/components/ui/Input.tsx
3. Arquivo existente: src/components/ui/Button.tsx
4. Arquivo existente: src/screens/CashFlowProjection.tsx
5. Acoes:
6. Criar formulario simples de fixa com campos minimos.
7. Integrar com commitmentStore.
8. Criterio de pronto:
9. Cadastro concluido em ate 3 passos.

### Task C2 - Cadastro rapido de parcelamento
1. Arquivo novo: src/components/CommitmentFormInstallment.tsx
2. Arquivo existente: src/screens/CashFlowProjection.tsx
3. Acoes:
4. Criar formulario de parcelamento com totalParcelas e parcelaAtual.
5. Validar limites (parcelaAtual <= totalParcelas).
6. Criterio de pronto:
7. Projecao atualiza imediatamente apos salvar.

## Fase 4 - P2 (evolucao segura)

### Task D1 - Avanco manual de parcela paga
1. Arquivo existente: src/commitmentStore.ts
2. Arquivo existente: src/screens/CashFlowProjection.tsx
3. Acoes:
4. Implementar acao para incrementar parcela atual com validacao.
5. Recalcular horizonte apos atualizacao.
6. Criterio de pronto:
7. Parcelamento encerra sem ultrapassar total.

### Task D2 - Feature flag de rollout
1. Arquivo novo: src/featureFlags.ts
2. Arquivo existente: src/router.tsx
3. Arquivo existente: src/components/NavBar.tsx
4. Acoes:
5. Guardar rota e menu atras de flag.
6. Criterio de pronto:
7. Ativacao/desativacao sem alterar dados salvos.

## Fase 5 - Ajustes de qualidade

### Task E1 - Testes de interface
1. Arquivo novo: tests/cash-flow-projection-ui.test.js
2. Arquivo existente: tests/month-review-controls.test.js
3. Acoes:
4. Cobrir troca de horizonte e filtros de costType.
5. Cobrir render da tabela e cards de resumo.
6. Criterio de pronto:
7. Sem regressao visual ou de comportamento principal.

### Task E2 - Documentacao de uso
1. Arquivo existente: docs/guia-passo-a-passo-iniciante.md
2. Arquivo existente: docs/projecao-fluxo-caixa-especificacao.md
3. Arquivo existente: docs/backlog-projecao-fluxo-caixa.md
4. Acoes:
5. Adicionar passo de uso da nova area para usuario iniciante.
6. Criterio de pronto:
7. Guia inclui fluxo minimo de cadastro e leitura da previsao.

## Ordem recomendada de execucao
1. A1 -> A2 -> A3
2. B1 -> B2 -> B3
3. C1 -> C2
4. E1
5. D1 -> D2 -> E2

## Definicao de pronto (MVP)
1. Usuario consegue cadastrar fixas e parceladas.
2. Sistema projeta 3, 6 e 12 meses com totais corretos.
3. Tela acessivel por menu e rota.
4. Testes de motor aprovados.
