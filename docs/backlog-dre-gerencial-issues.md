# Backlog em formato de Issues - Fase DRE Gerencial Completa

## Como usar este backlog
- Cada item abaixo ja esta em formato de issue.
- Sugestao de labels: `fase/dre-gerencial`, `tipo/feature`, `especialista/*`, `sprint/*`, `risco/*`.
- Estimativa em pontos (escala Fibonacci).

## EPIC
### ISSUE 00 - EPIC: Fase DRE Gerencial Completa
- Tipo: Epic
- Especialista lider: Produto
- Sprint alvo: S1-S3
- Pontos: 0
- Risco: Medio
- Objetivo:
  - Evoluir a DRE atual resumida para um relatorio gerencial detalhado, com subtotalizacoes e saida imprimivel/PDF alinhada ao modelo de referencia.
- Criterios de aceite:
  - DRE detalhada em tela com hierarquia e subtotais.
  - Impressao em A4 sem quebra de estrutura.
  - Exportacao PDF numericamente consistente com a tela.
  - Homologacao com stakeholder em cenarios reais.

---

## Sprint 1 - Base detalhada e consistencia de calculo

### ISSUE 01 - Matriz de paridade do modelo de referencia
- Tipo: Feature
- Especialista: Produto
- Sprint: S1
- Pontos: 5
- Risco: Medio
- Dependencias: ISSUE 00
- Descricao:
  - Mapear secao por secao do modelo de DRE gerencial para a estrutura alvo no produto.
  - Definir itens obrigatorios e opcionais por secao.
- Criterios de aceite:
  - Matriz com 100% das secoes mapeadas.
  - Campos sem fonte atual identificados como gap.

### ISSUE 02 - Politica de exibicao de contas sem movimento
- Tipo: Feature
- Especialista: Produto
- Sprint: S1
- Pontos: 3
- Risco: Baixo
- Dependencias: ISSUE 01
- Descricao:
  - Definir quando linhas com valor zero aparecem ou ficam ocultas.
- Criterios de aceite:
  - Regra unica para tela e exportacao.
  - Regra documentada com exemplos.

### ISSUE 03 - Regras de subtotalizacao por bloco
- Tipo: Feature
- Especialista: Calculo
- Sprint: S1
- Pontos: 8
- Risco: Medio
- Dependencias: ISSUE 01
- Descricao:
  - Definir e implementar subtotal de receitas, deducoes, custos e despesas.
- Criterios de aceite:
  - Subtotais batem com memoria de calculo.
  - Resultado operacional consistente em casos de teste.

### ISSUE 04 - Dicionario de classificacao contábil-gerencial
- Tipo: Feature
- Especialista: Calculo
- Sprint: S1
- Pontos: 5
- Risco: Medio
- Dependencias: ISSUE 01
- Descricao:
  - Definir mapeamento de categorias em blocos e subgrupos da DRE.
- Criterios de aceite:
  - Nao ha categoria em grupo incorreto nos cenarios de validacao.

### ISSUE 05 - Camada hierarquica da DRE (linhas, sublinhas, subtotais)
- Tipo: Feature
- Especialista: Aplicacao
- Sprint: S1
- Pontos: 8
- Risco: Medio
- Dependencias: ISSUE 03, ISSUE 04
- Descricao:
  - Criar estrutura de dados para renderizacao detalhada da DRE.
- Criterios de aceite:
  - Estrutura suporta pelo menos 3 niveis hierarquicos.
  - Performance aceitavel em mes com alto volume de contas.

### ISSUE 06 - Evolucao da tela DRE para modo detalhado
- Tipo: Feature
- Especialista: Aplicacao + UX/UI
- Sprint: S1
- Pontos: 8
- Risco: Medio
- Dependencias: ISSUE 05
- Descricao:
  - Atualizar visualizacao da DRE com secoes e subtotais.
- Criterios de aceite:
  - Leitura clara em desktop e mobile.
  - Nao quebra os fluxos existentes de navegacao.

### ISSUE 07 - Plano de testes e regressao da DRE
- Tipo: Test
- Especialista: QA
- Sprint: S1
- Pontos: 5
- Risco: Baixo
- Dependencias: ISSUE 06
- Descricao:
  - Criar cobertura de testes para subtotalizacoes e regressao da DRE atual.
- Criterios de aceite:
  - Suite verde com casos positivos e negativos.
  - Evidencias de teste registradas.

---

## Sprint 2 - Impressao e PDF

### ISSUE 08 - Padrao de cabecalho formal do relatorio
- Tipo: Feature
- Especialista: Produto
- Sprint: S2
- Pontos: 3
- Risco: Baixo
- Dependencias: ISSUE 06
- Descricao:
  - Definir cabecalho: empresa, CNPJ, mes/ano, livro/folha.
- Criterios de aceite:
  - Padrao aprovado pelo stakeholder.

### ISSUE 09 - Layout de impressao A4
- Tipo: Feature
- Especialista: UX/UI + Aplicacao
- Sprint: S2
- Pontos: 5
- Risco: Medio
- Dependencias: ISSUE 08
- Descricao:
  - Criar folha de estilo para impressao paginada.
- Criterios de aceite:
  - Sem cortes de secoes e sem sobreposicao de texto.

### ISSUE 10 - Exportacao PDF da DRE detalhada
- Tipo: Feature
- Especialista: Aplicacao
- Sprint: S2
- Pontos: 8
- Risco: Medio
- Dependencias: ISSUE 09
- Descricao:
  - Implementar exportacao PDF mantendo hierarquia e totais.
- Criterios de aceite:
  - Valores no PDF iguais aos da tela no mesmo contexto.
  - Arquivo abre corretamente em leitores comuns.

### ISSUE 11 - Validacao de consistencia Tela x PDF
- Tipo: Test
- Especialista: QA
- Sprint: S2
- Pontos: 5
- Risco: Baixo
- Dependencias: ISSUE 10
- Descricao:
  - Comparar amostras de valores e totalizacoes entre tela e PDF.
- Criterios de aceite:
  - Zero divergencia numerica nos casos de referencia.

---

## Sprint 3 - Homologacao e refinamento final

### ISSUE 12 - Homologacao com dados reais do stakeholder
- Tipo: Feature
- Especialista: Produto + QA
- Sprint: S3
- Pontos: 5
- Risco: Medio
- Dependencias: ISSUE 11
- Descricao:
  - Rodar homologacao com ao menos 3 meses/cenarios reais.
- Criterios de aceite:
  - Stakeholder aprova estrutura e utilidade do relatorio.

### ISSUE 13 - Ajustes de classificacao e bordas de calculo
- Tipo: Feature
- Especialista: Calculo + Aplicacao
- Sprint: S3
- Pontos: 8
- Risco: Medio
- Dependencias: ISSUE 12
- Descricao:
  - Corrigir casos de borda e ajustes de classificacao identificados na homologacao.
- Criterios de aceite:
  - Casos reportados fechados e retestados.

### ISSUE 14 - Otimizacao de UX de leitura e filtros
- Tipo: Feature
- Especialista: UX/UI + Aplicacao
- Sprint: S3
- Pontos: 5
- Risco: Baixo
- Dependencias: ISSUE 12
- Descricao:
  - Refinar leitura, navegacao e filtros por mes/empresa.
- Criterios de aceite:
  - Usuario gera e interpreta DRE detalhada em ate 3 passos.

### ISSUE 15 - Regressao final da fase
- Tipo: Test
- Especialista: QA
- Sprint: S3
- Pontos: 5
- Risco: Baixo
- Dependencias: ISSUE 13, ISSUE 14
- Descricao:
  - Executar regressao completa da fase e consolidar evidencias.
- Criterios de aceite:
  - Sem regressao critica em DRE, revisao mensal e deducoes.

---

## Itens removidos/adiados com base nos audios (controle de escopo)

### ISSUE 16 - (ADIADO) Fiscal formal completo
- Tipo: Spike/Adiado
- Especialista: Produto
- Sprint: Backlog futuro
- Pontos: 0
- Risco: Alto
- Motivo:
  - Stakeholder reforcou que o foco atual e gerencial, nao fiscal/legal.

### ISSUE 17 - (ADIADO) Calendario rigido de vencimentos por imposto
- Tipo: Spike/Adiado
- Especialista: Produto
- Sprint: Backlog futuro
- Pontos: 0
- Risco: Medio
- Motivo:
  - Operacao real informada e irregular; prioridade maior em lancamento de pago/atraso.

### ISSUE 18 - (ADIADO) Exportacao DOCX nativa
- Tipo: Spike/Adiado
- Especialista: Aplicacao
- Sprint: Backlog futuro
- Pontos: 0
- Risco: Medio
- Motivo:
  - PDF cobre necessidade imediata; DOCX pode entrar apos estabilizacao da fase.

---

## Definicao de pronto da fase
- DRE detalhada com hierarquia e subtotais.
- Layout de impressao A4 estavel.
- Exportacao PDF consistente com tela.
- Homologacao concluida com stakeholder.
- Regressao sem falhas criticas.
