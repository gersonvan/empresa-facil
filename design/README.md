# Handoff: EmpresaFacil MVP

## Overview

EmpresaFacil é um sistema web de controle de custos para pequenas empresas, focado em extrema simplicidade de uso. O MVP cobre registro de custos/receitas (empresa e pessoal), DRE mensal simplificado, importação de planilha, fechamento mensal e suporte a multiempresa.

**Público:** Dono e Financeiro de pequenas empresas brasileiras  
**Uso:** Diário  
**Plataformas:** Web responsivo — desktop e mobile

---

## Sobre os arquivos de design

Os arquivos neste pacote são **protótipos de referência criados em HTML/React**. Eles mostram a aparência e o comportamento pretendidos, mas **não são código de produção**. A tarefa é **recriar estas interfaces no ambiente existente do projeto** (framework, design system e padrões já adotados) — ou, se não houver ambiente definido, escolher o stack mais adequado (ex: Next.js + Tailwind + shadcn/ui) e implementar a partir daí.

---

## Fidelidade

**Alta fidelidade (hifi).** Os protótipos têm cores finais, tipografia, espaçamentos, interações e estados hover/active definidos. O desenvolvedor deve recriar pixel a pixel usando as bibliotecas e padrões do projeto.

---

## Design Tokens

### Cores — Modo Claro

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#F8F7F4` | Fundo geral (quente, não branco puro) |
| `card` | `#FFFFFF` | Fundo de cards |
| `subtle` | `#F2EFE9` | Fundo sutil, segmented control, inputs |
| `border` | `#E8E3DA` | Bordas de cards e inputs |
| `borderStrong` | `#C5BEB2` | Bordas de separação fortes |
| `text` | `#1A1A18` | Texto primário |
| `text2` | `#5C5954` | Texto secundário / labels |
| `text3` | `#9A9690` | Texto terciário / placeholders |
| `green` | `#1B4332` | Verde primário (botões, sidebar, destaques) |
| `greenMid` | `#2D6A4F` | Verde hover |
| `greenLite` | `#E4F2EB` | Verde claro (badge bg, banner bg) |
| `pos` | `#15803D` | Valores positivos / receitas |
| `posBg` | `#F0FDF4` | Fundo de valores positivos |
| `neg` | `#B91C1C` | Valores negativos / custos |
| `negBg` | `#FFF1F1` | Fundo de valores negativos |
| `warn` | `#92400E` | Avisos e alertas |
| `warnBg` | `#FFFBEB` | Fundo de avisos |
| `info` | `#1D4ED8` | Informações |
| `infoBg` | `#EFF6FF` | Fundo de informações |
| `sidebarBg` | `#1B4332` | Fundo da sidebar |
| `sidebarText` | `#C8E6D6` | Texto inativo na sidebar |
| `sidebarActive` | `#FFFFFF` | Texto ativo na sidebar |
| `sidebarActiveBg` | `rgba(255,255,255,0.12)` | Fundo item ativo na sidebar |

### Cores — Modo Escuro

| Token | Valor |
|---|---|
| `bg` | `#111210` |
| `card` | `#1C1E1B` |
| `subtle` | `#252720` |
| `border` | `#2E312B` |
| `text` | `#F0EDE6` |
| `text2` | `#9A9690` |
| `text3` | `#6A6660` |
| `green` | `#52B788` |
| `greenMid` | `#74C69D` |
| `greenLite` | `#0C2015` |
| `pos` | `#52B788` |
| `posBg` | `#0C2015` |
| `neg` | `#F87171` |
| `negBg` | `#2D1515` |
| `sidebarBg` | `#0D160F` |

### Tipografia

| Elemento | Font | Peso | Tamanho | Letter-spacing |
|---|---|---|---|---|
| Logo / App name | Figtree | 800 | 15px | -0.01em |
| Títulos de tela | Figtree | 800 | 22px | -0.02em |
| KPI valores | Figtree | 800 | 26px | -0.02em |
| Subtítulos de seção | Figtree | 700 | 14–16px | — |
| Labels de campo | Figtree | 600 | 12px | 0.3px |
| Corpo / listas | Figtree | 400–600 | 13–14px | — |
| Badges | Figtree | 700 | 11px | 0.2px |
| Cabeçalhos de sidebar | Figtree | 500–600 | 14px | — |

> Fonte: **Figtree** via Google Fonts — `https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900`

### Espaçamentos

- Grid base: **8px**
- Padding de card: **20px** (compacto: 14px)
- Gap entre cards/seções: **24px**
- Gap entre itens de lista: **0** (divididos por `<hr>`)
- Padding lateral de conteúdo (desktop): **32px**
- Padding lateral de conteúdo (mobile): **16px**

### Bordas e sombras

| Elemento | Valor |
|---|---|
| Border radius — card | `12px` |
| Border radius — button | `8px` |
| Border radius — input | `8px` |
| Border radius — badge/pill | `100px` |
| Border radius — modal | `18px` |
| Border radius — avatar/ícone | `9–12px` |
| Sombra de card (rest) | `0 1px 3px rgba(0,0,0,0.04)` |
| Sombra de card (hover) | `0 6px 20px rgba(0,0,0,0.10)` |
| Sombra de modal | `0 24px 80px rgba(0,0,0,0.22)` |
| Border de input (focus) | `1.5px solid #2D6A4F` |

---

## Layout e Navegação

### Desktop (≥ 768px)
- **Sidebar** fixa à esquerda, largura `220px`, fundo `#1B4332`
- **Conteúdo principal** ocupa o restante, scroll vertical interno
- **Max-width do conteúdo:** `860px`, centralizado com `margin: 0 auto`

### Mobile (< 768px)
- **Header** compacto com logo + botão de troca de empresa, fundo `#1B4332`
- **Bottom navigation** com 5 itens fixada na base
- Sem sidebar

### Sidebar — estrutura
```
[Logo EmpresaFacil]
[Company switcher — botão clicável → tela Empresas]
──────────────────
Dashboard
Registrar          ← abre modal, não navega
DRE Mensal
Fechamento
Importar
──────────────────
Empresas
```

### Bottom Nav — ordem
`Início | Registrar | DRE | Fechar | Importar`

---

## Telas / Views

### 1. Dashboard

**Propósito:** Visão geral do mês atual com 3 KPIs, próximo passo guiado e lista de lançamentos recentes.

**Layout:**
```
[Saudação + nome empresa]  [Botão "Registrar lançamento"]
[KPI: Receita] [KPI: Despesas] [KPI: Resultado]   ← flex row, wrap no mobile
[Banner "Próximo passo"]
[Título "Lançamentos recentes"]  [Link "Ver todos"]
[Card com lista de entradas]
```

**KPI Cards (×3):**
- `flex: 1`, `min-width: 0`, quebram para coluna no mobile
- Label: `12px / 600 / #9A9690 / uppercase / letter-spacing 0.5px`
- Valor: `26px / 800 / tabular-nums / letter-spacing -0.02em`
- "Resultado" usa `#15803D` se positivo, `#B91C1C` se negativo
- Delta: `12px / 600 / verde ou vermelho / "▲ 12% vs mês ant."`

**Banner "Próximo Passo":**
- Background: `#E4F2EB`, border: `rgba(27,67,50,0.15)`
- Título da seção: `11px / 700 / #2D6A4F / uppercase`
- Título principal: `15px / 700 / #1B4332`
- Subtítulo: `13px / #2D6A4F`
- Botão outline verde à direita

**Lista de lançamentos:**
- Card com `padding: 0`, dividers entre itens
- Cada item: ícone 36×36 (↑ verde ou ↓ vermelho), descrição + categoria, valor + data
- Ícone: fundo `#F0FDF4` (receita) ou `#FFF1F1` (custo)
- Valor: `14px / 700 / tabular-nums`
- "Pessoal" aparece como badge `info`

---

### 2. Registrar Lançamento (modal)

**Propósito:** Fluxo de 3 passos para registrar um custo ou receita. **Tela prioritária.**

**Apresentação:**
- Desktop: modal centralizado, `max-width: 500px`, fundo com overlay blur `rgba(0,0,0,0.45) + backdrop-filter: blur(3px)`
- Mobile: full-screen (ocupa toda a tela)
- Border radius do modal: `18px`

**Header fixo do modal:**
- Título: `"Registrar lançamento"` — `16px / 800`
- Subtítulo: `"Passo X de 3"` — `12px / text3`
- Indicador de progresso: 3 dots — ponto atual tem `width: 20px`, os outros `8px`, todos `height: 8px`, `border-radius: 100px`
- Botão ✕ para fechar

**Passo 1 — Tipo:**
- Segmented control "↓ Custo / ↑ Receita" (full width)
- Segmented control "🏢 Empresa / 👤 Pessoal" (full width)
- Card descritivo com contexto (texto muda conforme seleção)
- Botão "Continuar →" primary full width

**Passo 2 — Detalhes:**
- Input **Valor** grande (`font-size: 22px / 700`), prefixo "R$"
- Input Descrição (`14px`)
- Select Categoria (lista varia por tipo/origem)
- Input Data (padrão: data de hoje)
- Seção colapsável "Opcional" com campo Nota fiscal
- Botões: "← Voltar" (secondary) + "Continuar →" (primary, desabilitado sem valor e descrição)

**Passo 3 — Confirmar:**
- Card de resumo: fundo `#F0FDF4` (receita) ou `#FFF1F1` (custo)
- Badges de tipo e origem
- Nome, categoria, data
- Valor grande alinhado à direita
- Botões: "← Voltar" + "Registrar agora" (primary full)

**Estado de Sucesso:**
- Ícone ✓ em círculo verde `64×64`
- Título "Registrado com sucesso!" `18px / 800`
- Subtítulo com nome e valor
- Botões: "Registrar outro" (secondary) | "Ver no Dashboard" (primary)

---

### 3. DRE Mensal

**Propósito:** Demonstrativo de Resultado do Exercício simplificado, 4 linhas + aviso de validação.

**Layout:**
```
[Título "DRE Mensal"]  [Badge "Simples Nacional"]
[Card DRE com linhas]
[Card de aviso ⚠️]
```

**Card DRE:**
- `padding: 0`, overflow hidden
- Linhas normais: `padding: 12px 20px`
- Linha total (Resultado): `padding: 16px 20px`, `background: #F2EFE9`, `border-top`
- Label à esquerda: `14px / 500 / text2` (normais), `15px / 800 / text` (total)
- Sublabel: `12px / text3` (ex: "Alíquota estimada 9%")
- Valor à direita: `15px / 600` (normais), `20px / 800` (total)
- Valores positivos: `text`, negativos: `#B91C1C`
- Resultado positivo: `#15803D`
- Barra de margem: `height: 8px`, preenchimento `background: #15803D`, bordas arredondadas

**Card de aviso:**
- `background: #FFFBEB`, `border-color: #FDE68A`
- Ícone ⚠️ + título `13px / 700 / #92400E` + texto `12px`

---

### 4. Fechamento Mensal

**Propósito:** Controlar o status de fechamento do mês atual e ver histórico.

**Layout:**
```
[Título "Fechamento Mensal"]
[Card do mês atual com status + progress + ação]
[Seção "Histórico" com lista de meses anteriores]
```

**Card do mês atual:**
- Header: nome do mês + badge de status (direita)
- Status: `"Aberto"` → badge default / `"Em Revisão"` → badge warning / `"Fechado"` → badge success
- Barra de progresso: `height: 6px`, background `#F2EFE9`, fill `#1B4332`, border-radius `100px`
- Texto de progresso: `"X de Y lançamentos registrados"` + percentual
- Botão de ação muda conforme status:
  - Aberto: `"Enviar para revisão →"` — secondary
  - Em Revisão: `"Aprovar e fechar"` — primary
  - Fechado: sem botão, exibe card de confirmação verde

**Lista de histórico:**
- Card com `padding: 0`
- Cada item: ícone ✓ 32×32 verde, nome do mês + badge "Fechado", resultado + link "Ver →"

---

### 5. Importar Planilha

**Propósito:** Upload de .xlsx/.csv com feedback linha a linha de erros.

**Estágios:** `upload` → `preview` → `done`

**Zona de upload:**
- Border: `2px dashed #E8E3DA` (hover: `#1B4332`)
- Background: `#F2EFE9` (hover: `#E4F2EB`)
- Border-radius: `14px`, padding `48px 24px`
- Ícone 📄, título `15px / 700`, subtítulo `13px / text3`
- Badge com formatos aceitos

**Preview (após "upload"):**
- Badges de resumo: "X linhas válidas" (success) + "Y erros" (error)
- Card lista com padding 0
- Cada linha: ícone ✓/✕ 28×28 (verde/vermelho), descrição, número da linha (direita)
- Linhas com erro: descrição em vermelho `600`, mensagem de erro abaixo `11px`
- Footer: "Cancelar" (secondary) + "Importar X linhas válidas →" (primary)

**Sucesso:**
- Card centralizado com ✓ grande, título, subtítulo, botão "Nova importação"

---

### 6. Empresas

**Propósito:** Visualizar e trocar de empresa; adicionar nova.

**Layout:**
```
[Título "Minhas Empresas"]
[Card lista de empresas]
[Botão "+ Adicionar empresa"]
[Card informativo azul sobre multiempresa]
```

**Lista de empresas:**
- Card `padding: 0`
- Empresa ativa: fundo `#E4F2EB`, texto verde, badge "Ativa" (primary + dot)
- Empresa inativa: botão "Usar" (secondary) à direita
- Avatar: 44×44 `border-radius: 12px`, inicial do nome, fundo verde (ativa) ou sutil (inativa)
- Nome: `15px / 700`, subtítulo: `12px / text3` com CNPJ e regime

---

## Interações e Comportamento

### Navegação
- Clicar em item da sidebar/bottom nav → navega para a tela
- "Registrar" na sidebar/bottom nav → **abre modal** (não navega)
- Company switcher na sidebar → navega para tela Empresas
- Trocar empresa na tela Empresas → volta ao Dashboard com empresa nova

### Hover States
- Cards clicáveis: `translateY(-1px)` + shadow `0 6px 20px rgba(0,0,0,0.10)`
- Botão primary: muda de `#1B4332` para `#2D6A4F`
- Botão secondary: fundo muda para `#F2EFE9`
- Itens da sidebar: `rgba(255,255,255,0.06)` no hover
- Zona de drag: borda e fundo verde claro

### Transições
- Todas as transições de estado: `all 0.15s ease`
- Barra de progresso (DRE e Fechamento): `width 0.6s ease`
- Dots do stepper: `width 0.25s` (ativo fica mais largo)
- Modal: fade in com overlay

### Fluxo do Lançamento
1. Seleciona Tipo (Custo/Receita) + Origem (Empresa/Pessoal) → Continuar
2. Preenche Valor + Descrição (obrigatórios) + Categoria + Data → Continuar (desabilitado sem valor e descrição)
3. Revisa resumo → Registrar → Estado de sucesso por 2.2s → fecha modal

### Fechamento Mensal
- Clique em "Enviar para revisão" → status muda para "Em Revisão" (badge warning)
- Clique em "Aprovar e fechar" → status muda para "Fechado" (badge success + card de confirmação)

### Importação
- Clique na zona de drop simula upload e vai para preview
- "Importar X linhas" → estado de sucesso
- "Cancelar" → volta para zona de upload

---

## Responsividade

| Breakpoint | Layout |
|---|---|
| ≥ 768px | Sidebar 220px + conteúdo com padding 32px |
| < 768px | Header compacto + Bottom Nav + padding 16px |

KPI cards: `flex-wrap: wrap` — cada card tem `flex: 1, min-width: ~200px`. No mobile, empilham verticalmente.

---

## Componentes Reutilizáveis

### Button
Variantes: `primary`, `secondary`, `ghost`, `outline`, `danger`  
Tamanhos: `sm`, `md`, `lg`, `xl`  
Props: `full` (width: 100%), `icon` (elemento à esquerda), `disabled`

### Card
- `background: #FFFFFF`, `border: 1px solid #E8E3DA`, `border-radius: 12px`
- Se clicável: hover com translateY(-1px) + shadow
- Prop `p` para padding customizado

### Badge
Variantes: `default`, `success`, `error`, `warning`, `primary`, `info`  
Prop `dot` adiciona bolinha colorida antes do texto

### Input
- Border focus: `1.5px solid #2D6A4F`
- Prop `big`: tamanho maior para campo de valor (`22px / 700`)
- Prop `prefix`: prefixo com fundo sutil (ex: "R$")
- Prop `opt`: adiciona "(opcional)" em cinza

### Segmented Control
- Fundo: `#F2EFE9`, item ativo: `#FFFFFF` com sombra
- Full width com prop `full`

### KPI Card
- Label uppercase pequeno
- Valor grande `26px / 800 / tabular-nums`
- Delta opcional com ▲/▼ e cor

### Badge de Status (Fechamento)
- Aberto: `[subtle/text2]`
- Em Revisão: `[#FFFBEB/#92400E]`
- Fechado: `[#F0FDF4/#15803D]`

---

## Dados Mock (estrutura)

```typescript
// Empresa
interface Company {
  id: number;
  name: string;      // "Padaria São João"
  type: string;      // "MEI" | "PF" | "LTDA"
  regime: string;    // "Simples Nacional" | null
  cnpj: string | null;
}

// Lançamento
interface Entry {
  id: number;
  desc: string;      // Descrição
  val: number;       // Negativo = custo, positivo = receita
  cat: string;       // Categoria
  date: string;      // "Hoje" | "dd/mm"
  type: 'custo' | 'receita';
  origin: 'empresa' | 'pessoal';
}

// DRE
interface DRE {
  receitaBruta: number;
  aliquota: number;       // % do Simples Nacional
  deducoes: number;       // negativo
  despesas: number;       // negativo
  resultado: number;
}

// Fechamento
interface MonthClose {
  status: 'aberto' | 'revisao' | 'fechado';
  progress: number;       // 0-100
  total: number;          // total de lançamentos esperados
  done: number;           // lançamentos feitos
  due: string;            // "31/05/2026"
}
```

---

## Arquivos de Design

| Arquivo | Conteúdo |
|---|---|
| `EmpresaFacil.html` | Protótipo principal interativo — abrir no browser |
| `ef-ui.jsx` | Tokens + componentes base (Button, Card, Badge, Input, etc.) |
| `ef-screens.jsx` | Todas as 6 telas com dados mock |
| `tweaks-panel.jsx` | Painel de tweaks (dark mode, cor, compacto) |

> **Como visualizar:** Abra `EmpresaFacil.html` em qualquer browser moderno. Não precisa de servidor.

---

## Notas para o Desenvolvedor

1. **Validação tributária:** O campo de alíquota do Simples Nacional deve ser configurável por empresa. Sempre exibir o aviso de validação com contador — não é um cálculo fiscal definitivo.

2. **Multiempresa:** Todos os dados (lançamentos, DRE, fechamento) são isolados por empresa. O contexto de empresa deve ser gerenciado globalmente (Context API, Zustand, Redux, etc.).

3. **Lançamentos pessoais vs empresa:** São categorias distintas. O filtro "Pessoal" deve ser visível no Dashboard e no DRE para que o dono saiba separar o que é custo da empresa do que é custo do sócio.

4. **Fechamento mensal:** O fluxo `aberto → em revisão → fechado` deve ser controlado por role (Financeiro envia para revisão; Dono aprova e fecha). No MVP sem auth, simular apenas o fluxo visual.

5. **Importação:** Validar cada linha no frontend antes de enviar ao backend. Erros comuns: categoria não mapeada, data inválida (32/05), valor ausente ou não numérico.

6. **Formato de moeda:** Sempre usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Valores acima de R$1.000 podem ser exibidos como "R$\u00a048,5k" em KPIs.
