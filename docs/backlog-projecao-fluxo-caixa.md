# Backlog Tecnico - Projecao de Fluxo de Caixa

## Convencoes
1. Prioridade: P0 (essencial), P1 (importante), P2 (evolutivo).
2. Esforco: S (ate 1 dia), M (2 a 4 dias), L (5 dias ou mais).

## EPICO 1 - Fundacao de dados

### T1.1 - Criar store de compromissos financeiros
1. Prioridade: P0
2. Esforco: M
3. Dependencias: nenhuma
4. Entregas:
5. Estrutura de armazenamento local para compromissos.
6. CRUD basico com validacoes.
7. Criterio de pronto:
8. Criar, listar, editar e excluir funcionando em ambiente local.

### T1.2 - Definir tipos e contratos de dominio
1. Prioridade: P0
2. Esforco: S
3. Dependencias: T1.1
4. Entregas:
5. Tipos para compromisso fixo e parcelado.
6. Tipos para entrada e saida de projecao mensal.
7. Criterio de pronto:
8. Tipagem valida sem erro em build TypeScript.

### T1.3 - Migracao segura para versao de armazenamento
1. Prioridade: P1
2. Esforco: S
3. Dependencias: T1.1
4. Entregas:
5. Leitura retrocompativel de dados sem quebrar registros antigos.
6. Criterio de pronto:
7. App abre com dados antigos sem perda de informacao.

## EPICO 2 - Motor de projecao

### T2.1 - Gerador de horizonte mensal
1. Prioridade: P0
2. Esforco: S
3. Dependencias: T1.2
4. Entregas:
5. Funcao para gerar meses futuros com base em mes de referencia.
6. Criterio de pronto:
7. Retorna corretamente horizontes de 3, 6 e 12 meses.

### T2.2 - Regra de projecao para contas fixas
1. Prioridade: P0
2. Esforco: M
3. Dependencias: T2.1
4. Entregas:
5. Inclusao de compromisso fixo em todos os meses ativos.
6. Criterio de pronto:
7. Projecao fixa confere com cenarios de teste.

### T2.3 - Regra de projecao para parcelamentos
1. Prioridade: P0
2. Esforco: M
3. Dependencias: T2.1
4. Entregas:
5. Projecao de parcelas restantes sem ultrapassar totalParcelas.
6. Criterio de pronto:
7. Parcelamento encerra corretamente no mes esperado.

### T2.4 - Consolidacao mensal e indicadores
1. Prioridade: P0
2. Esforco: M
3. Dependencias: T2.2, T2.3
4. Entregas:
5. Totais por mes: fixas, parceladas e total.
6. Identificacao do mes com maior comprometimento.
7. Criterio de pronto:
8. Valores consolidados batem com massa de teste.

## EPICO 3 - Tela Projecao de Fluxo de Caixa

### T3.1 - Criar tela e rota no menu
1. Prioridade: P1
2. Esforco: M
3. Dependencias: T2.4
4. Entregas:
5. Nova tela Projecao de Fluxo de Caixa integrada a navegacao.
6. Criterio de pronto:
7. Rota acessivel e sem regressao de layout.

### T3.2 - Filtros de horizonte e costType
1. Prioridade: P1
2. Esforco: S
3. Dependencias: T3.1
4. Entregas:
5. Filtros para 3, 6 e 12 meses e empresa/pessoal.
6. Criterio de pronto:
7. Atualizacao dos dados em tempo real ao trocar filtros.

### T3.3 - Cards de resumo executivo
1. Prioridade: P1
2. Esforco: S
3. Dependencias: T3.2
4. Entregas:
5. Cards para proximo mes, 3 meses e 12 meses.
6. Criterio de pronto:
7. Valores dos cards consistentes com tabela mensal.

### T3.4 - Tabela mensal de projecao
1. Prioridade: P1
2. Esforco: M
3. Dependencias: T3.2
4. Entregas:
5. Tabela com mes, fixas, parceladas e total.
6. Destaque de mes de pico.
7. Criterio de pronto:
8. Tabela responsiva em mobile e desktop.

## EPICO 4 - Operacao de compromissos

### T4.1 - Formulario de cadastro de conta fixa
1. Prioridade: P1
2. Esforco: M
3. Dependencias: T1.1
4. Entregas:
5. Fluxo de cadastro simples para recorrencia mensal.
6. Criterio de pronto:
7. Cadastro concluido em ate 3 passos.

### T4.2 - Formulario de cadastro de parcelamento
1. Prioridade: P1
2. Esforco: M
3. Dependencias: T1.1
4. Entregas:
5. Campos de total de parcelas, parcela atual e inicio.
6. Criterio de pronto:
7. Projecao reflete imediatamente parcelas restantes.

### T4.3 - Avanco manual de parcela paga
1. Prioridade: P2
2. Esforco: S
3. Dependencias: T4.2
4. Entregas:
5. Acao para incrementar parcela atual apos pagamento.
6. Criterio de pronto:
7. Meses futuros sao recalculados sem inconsistencias.

## EPICO 5 - Qualidade e seguranca

### T5.1 - Testes unitarios do motor de projecao
1. Prioridade: P0
2. Esforco: M
3. Dependencias: T2.4
4. Entregas:
5. Suite cobrindo fixas, parceladas, inicio e fim.
6. Criterio de pronto:
7. Todos os cenarios principais com testes verdes.

### T5.2 - Testes de regressao de interface
1. Prioridade: P1
2. Esforco: S
3. Dependencias: T3.4
4. Entregas:
5. Verificacao de renderizacao e filtros basicos.
6. Criterio de pronto:
7. Tela funciona em desktop e mobile sem quebra.

### T5.3 - Feature flag de rollout
1. Prioridade: P2
2. Esforco: S
3. Dependencias: T3.1
4. Entregas:
5. Chave para ativar/desativar nova area sem remover codigo.
6. Criterio de pronto:
7. Rollback simples em caso de ajuste pos-release.

## Ordem recomendada de execucao
1. T1.1 -> T1.2 -> T2.1 -> T2.2 -> T2.3 -> T2.4
2. T5.1
3. T3.1 -> T3.2 -> T3.3 -> T3.4
4. T4.1 -> T4.2
5. T5.2
6. T1.3 -> T4.3 -> T5.3

## Marco MVP
1. Dados e motor prontos: Epico 1 e Epico 2 completos.
2. Tela pronta para uso: Epico 3 completo.
3. Confiabilidade minima: T5.1 concluida.

## Riscos e mitigacao
1. Risco: erro em parcelamento restante.
2. Mitigacao: validacoes de totalParcelas e currentInstallment com testes de borda.
3. Risco: excesso de complexidade no cadastro.
4. Mitigacao: separar formularios de fixa e parcelada com campos minimos.
5. Risco: projecao desatualizada por falta de manutencao.
6. Mitigacao: lembrete visual de ultima atualizacao e atalho rapido para revisar compromissos.
