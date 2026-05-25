# Projecao de Fluxo de Caixa - Especificacao Funcional

## Nome da area
Nome recomendado: Projecao de Fluxo de Caixa

Subtitulo recomendado: Contas Fixas e Parcelamentos Futuros

## Objetivo
Permitir que a empresa visualize antecipadamente os gastos dos proximos meses, separando contas fixas e parcelamentos para apoiar decisao de caixa e evitar surpresas no fechamento.

## Escopo do MVP
### Em escopo
1. Cadastro de compromissos financeiros previstos.
2. Tipos de compromisso: fixa e parcelada.
3. Projecao mensal para horizonte de 3, 6 e 12 meses.
4. Visao consolidada por mes com totais por tipo.
5. Sinalizacao de mes com maior comprometimento.

### Fora de escopo (MVP)
1. Integracao bancaria automatica.
2. Reajuste automatico por inflacao.
3. Simulador avancado de cenarios com variacao percentual.

## Conceitos
1. Compromisso Fixo: despesa recorrente mensal sem numero de parcelas.
2. Compromisso Parcelado: despesa com numero finito de parcelas.
3. Horizonte: quantidade de meses futuros usados na projecao.
4. Comprometimento Mensal: soma de fixas e parceladas previstas no mes.

## Requisitos funcionais
### RF-01 - Cadastro de compromisso
1. Permitir criar compromisso com descricao, valor e tipo.
2. Permitir definir data inicial de vigencia.
3. Permitir costType (empresa ou pessoal).

### RF-02 - Regras para compromisso fixo
1. Considerar o valor em todos os meses do horizonte a partir do inicio.
2. Permitir data final opcional para encerrar recorrencia.

### RF-03 - Regras para compromisso parcelado
1. Exigir totalParcelas e parcelaAtual no cadastro.
2. Projetar apenas parcelas restantes dentro do horizonte.
3. Encerrar automaticamente quando parcelas restantes chegar a zero.

### RF-04 - Painel de projecao
1. Permitir alternar horizonte entre 3, 6 e 12 meses.
2. Exibir cards com total do proximo mes, 3 meses e 12 meses.
3. Exibir tabela mensal com colunas: mes, fixas, parceladas, total.
4. Destacar mes de maior total previsto.

### RF-05 - Manutencao de compromissos
1. Permitir editar compromisso mantendo historico de atualizacao.
2. Permitir excluir compromisso futuro.
3. Em parcelados, permitir marcar avanco manual da parcela paga.

## Regras de negocio
1. Valores devem ser tratados em moeda BRL com precisao de centavos.
2. Um compromisso deve pertencer a apenas um costType por vez.
3. Mes fechado nao impede visualizar projecao, mas bloqueia alteracao de valores passados.
4. Parcelamentos nao podem gerar parcelas alem de totalParcelas.

## Modelo de dados (MVP)
Campos sugeridos para compromisso:
1. id
2. description
3. amount
4. type: fixed | installment
5. startMonth (YYYY-MM)
6. endMonth opcional (YYYY-MM)
7. totalInstallments opcional
8. currentInstallment opcional
9. costType: company | personal
10. categoryId opcional
11. notes opcional
12. createdAt
13. updatedAt

## Calculo da projecao
Para cada mes do horizonte:
1. Somar todos os compromissos fixos ativos no mes.
2. Somar parcelas previstas de compromissos parcelados ativos no mes.
3. Calcular totalMensal = fixas + parceladas.
4. Calcular acumulado do horizonte quando necessario.

## UX recomendada
1. Tela com foco em leitura rapida do comprometimento futuro.
2. Secao de resumo no topo e tabela logo abaixo.
3. Destaque visual para meses de pico de gastos.
4. Acesso rapido para adicionar fixa ou parcelamento em ate 3 passos.

## Criterios de aceite (produto)
1. Usuario consegue visualizar previsao dos proximos meses sem criar planilha externa.
2. Totais mensais batem com os compromissos cadastrados.
3. Parcelamentos param de ser projetados ao final das parcelas.
4. Filtros de horizonte e costType refletem valores corretos.

## Indicadores de sucesso
1. Tempo medio para montar previsao mensal.
2. Percentual de meses com projecao revisada antes do fechamento.
3. Reducao de ajustes emergenciais de caixa no fim do mes.
