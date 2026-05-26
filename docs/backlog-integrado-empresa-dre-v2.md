# Backlog Integrado v2 - Cadastro de Empresa + DRE Gerencial

## Objetivo
Evitar retrabalho entre as frentes de Cadastro de Empresa e DRE Gerencial, definindo bloqueios formais de execucao.

## Principio de execucao
- Regra principal: nenhuma entrega de DRE detalhada (hierarquica, cabecalho formal, PDF) inicia antes de fechar os bloqueadores de Empresa Ativa.

## Trilhas
- Trilha A: Fundacao de Empresa (bloqueadora)
- Trilha B: DRE Gerencial Completa (dependente)

---

## Trilha A - Fundacao de Empresa (Bloqueadora)

### EMP-01 - Modelo de dados de empresa
- Especialista: Produto + Aplicacao
- Pontos: 5
- Risco: Medio
- Entregavel:
  - Entidade empresa com campos minimos: id, nome, cnpj opcional, segmento opcional, status, createdAt, updatedAt.
- Aceite:
  - Contrato de dados aprovado por Produto, Calculo e QA.

### EMP-02 - Store de empresas (CRUD)
- Especialista: Aplicacao
- Pontos: 8
- Risco: Medio
- Dependencias: EMP-01
- Entregavel:
  - Operacoes de criar, editar, arquivar e listar empresas.
- Aceite:
  - Persistencia local funcionando e validada por testes unitarios.

### EMP-03 - Empresa ativa global
- Especialista: Aplicacao + UX/UI
- Pontos: 8
- Risco: Medio
- Dependencias: EMP-02
- Entregavel:
  - Seletor global de empresa ativa e estado persistido.
- Aceite:
  - Todas as telas principais leem a empresa ativa unica.

### EMP-04 - Migracao de dados legados
- Especialista: Aplicacao + QA
- Pontos: 8
- Risco: Alto
- Dependencias: EMP-03
- Entregavel:
  - Estrategia para dados antigos sem cadastro formal de empresa.
- Aceite:
  - Nenhum dado legado some; tudo fica vinculado a empresa padrao migrada.

### EMP-05 - Tela de configuracao de empresas
- Especialista: UX/UI + Aplicacao
- Pontos: 5
- Risco: Baixo
- Dependencias: EMP-03
- Entregavel:
  - Area em Configuracoes para gerenciar empresas.
- Aceite:
  - Usuario cria empresa e altera empresa ativa sem sair do fluxo.

### EMP-06 - Regressao de isolamento por empresa
- Especialista: QA + Calculo
- Pontos: 5
- Risco: Medio
- Dependencias: EMP-04, EMP-05
- Entregavel:
  - Suite de testes garantindo que DRE, deducoes e revisao mensal nao misturam empresas.
- Aceite:
  - Todos os cenarios de isolamento aprovados.

### Gate G1 (Bloqueio formal)
- A Trilha B (DRE Gerencial) so pode iniciar apos concluir: EMP-03, EMP-04 e EMP-06.

---

## Trilha B - DRE Gerencial Completa (Dependente)

### DRE-01 - Matriz de paridade com modelo de referencia
- Especialista: Produto
- Pontos: 5
- Risco: Medio
- Dependencias: Gate G1
- Entregavel:
  - Mapeamento secao por secao do modelo de DRE.
- Aceite:
  - Gaps de dados identificados e classificados.

### DRE-02 - Dicionario de classificacao e subtotalizacao
- Especialista: Calculo
- Pontos: 8
- Risco: Medio
- Dependencias: DRE-01
- Entregavel:
  - Regras de agrupamento por bloco e subtotais.
- Aceite:
  - Resultado operacional consistente em casos de teste.

### DRE-03 - Estrutura hierarquica da DRE
- Especialista: Aplicacao
- Pontos: 8
- Risco: Medio
- Dependencias: DRE-02
- Entregavel:
  - Camada para linhas, sublinhas e subtotais.
- Aceite:
  - Suporte a 3 niveis de hierarquia.

### DRE-04 - Tela DRE detalhada
- Especialista: UX/UI + Aplicacao
- Pontos: 8
- Risco: Medio
- Dependencias: DRE-03
- Entregavel:
  - Visual detalhado com navegacao e leitura clara.
- Aceite:
  - Responsivo e sem regressao de navegacao.

### DRE-05 - Impressao A4
- Especialista: UX/UI + Aplicacao
- Pontos: 5
- Risco: Medio
- Dependencias: DRE-04
- Entregavel:
  - Versao de impressao com paginacao estavel.
- Aceite:
  - Sem corte de secoes e sem sobreposicao de conteudo.

### DRE-06 - Exportacao PDF
- Especialista: Aplicacao
- Pontos: 8
- Risco: Medio
- Dependencias: DRE-05
- Entregavel:
  - Geracao de PDF da DRE detalhada.
- Aceite:
  - Valores do PDF iguais aos da tela no mesmo contexto.

### DRE-07 - Homologacao com stakeholder
- Especialista: Produto + QA
- Pontos: 5
- Risco: Medio
- Dependencias: DRE-06
- Entregavel:
  - Rodada de homologacao com cenarios reais.
- Aceite:
  - Aprovacao formal do stakeholder.

---

## Itens explicitamente adiados (para evitar escopo inchado)

### ADIADO-01 - Fiscal formal completo
- Motivo: foco atual e gerencial.

### ADIADO-02 - Calendario rigido de vencimentos
- Motivo: stakeholder indicou operacao irregular; priorizar lancamento e analise.

### ADIADO-03 - Exportacao DOCX nativa
- Motivo: PDF cobre necessidade imediata; DOCX entra apos estabilizacao.

---

## Sequencia sugerida por sprint

### Sprint A1
- EMP-01, EMP-02, EMP-03

### Sprint A2
- EMP-04, EMP-05, EMP-06
- Fechamento do Gate G1

### Sprint B1
- DRE-01, DRE-02, DRE-03, DRE-04

### Sprint B2
- DRE-05, DRE-06, DRE-07

---

## Definicao de pronto (integrada)
- Empresa ativa global funcionando com dados legados migrados.
- DRE detalhada sem mistura entre empresas.
- Impressao A4 + PDF consistentes.
- Homologacao concluida com stakeholder.
