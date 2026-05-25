export type CostType = 'company' | 'personal'
export type DreGroup = 'revenue' | 'deductions' | 'expenses'

export interface StoredCategory {
  id: string
  name: string
  costType: CostType
  dreGroup: DreGroup
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'empresa-facil:categories:v1'
const SEEDED_FLAG_KEY = 'empresa-facil:categories:seeded:v1'
const SEED_VERSION_KEY = 'empresa-facil:categories:seed-version:v1'
const CURRENT_SEED_VERSION = 2

const INITIAL_CATEGORIES: StoredCategory[] = [
  { id: 'cat-company-revenue-sales', name: 'Vendas', costType: 'company', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-revenue-services', name: 'Serviços', costType: 'company', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-revenue-subscriptions', name: 'Assinaturas recorrentes', costType: 'company', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-revenue-commissions', name: 'Comissões recebidas', costType: 'company', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-revenue-financial', name: 'Receitas financeiras', costType: 'company', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-deduction-discounts', name: 'Descontos incondicionais', costType: 'company', dreGroup: 'deductions', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-deduction-cancelled', name: 'Vendas canceladas', costType: 'company', dreGroup: 'deductions', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-deduction-returns', name: 'Devoluções de vendas', costType: 'company', dreGroup: 'deductions', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-deduction-taxes-sales', name: 'Tributos sobre vendas', costType: 'company', dreGroup: 'deductions', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-rent', name: 'Aluguel', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-payroll', name: 'Folha de pagamento', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-marketing', name: 'Marketing', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-tax', name: 'Impostos e taxas', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-office', name: 'Material de escritório', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-tech', name: 'Software e tecnologia', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-utilities', name: 'Energia e utilidades', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-logistics', name: 'Fretes e logística', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-travel', name: 'Viagens corporativas', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-legal', name: 'Serviços contábeis e jurídicos', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-company-expense-maintenance', name: 'Manutenção e reparos', costType: 'company', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-revenue-salary', name: 'Salário', costType: 'personal', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-revenue-extra', name: 'Renda extra', costType: 'personal', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-revenue-freelance', name: 'Freelance', costType: 'personal', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-revenue-investments', name: 'Rendimentos de investimentos', costType: 'personal', dreGroup: 'revenue', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-housing', name: 'Moradia', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-food', name: 'Alimentação', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-transport', name: 'Transporte', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-health', name: 'Saúde', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-education', name: 'Educação', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-leisure', name: 'Lazer', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-insurance', name: 'Seguros', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-utilities', name: 'Contas domésticas', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-personal-expense-credit-card', name: 'Fatura de cartão', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
]

function mergeSeedCategories(existing: StoredCategory[], seed: StoredCategory[]) {
  const next = [...existing]

  for (const seedCategory of seed) {
    const duplicate = next.some((category) => {
      return (
        category.costType === seedCategory.costType &&
        category.dreGroup === seedCategory.dreGroup &&
        normalizeName(category.name) === normalizeName(seedCategory.name)
      )
    })

    if (!duplicate) {
      next.push(seedCategory)
    }
  }

  return next
}

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function ensureInitialSeed() {
  if (!hasLocalStorage()) {
    return
  }

  const hasSeedFlag = window.localStorage.getItem(SEEDED_FLAG_KEY) === '1'
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES))
    window.localStorage.setItem(SEEDED_FLAG_KEY, '1')
    window.localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
    return
  }

  const seedVersionRaw = window.localStorage.getItem(SEED_VERSION_KEY)
  const seedVersion = Number(seedVersionRaw ?? '0') || 0

  if (hasSeedFlag && seedVersion >= CURRENT_SEED_VERSION) {
    return
  }

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      const merged = mergeSeedCategories(parsed as StoredCategory[], INITIAL_CATEGORIES)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES))
    }
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES))
  }

  window.localStorage.setItem(SEEDED_FLAG_KEY, '1')
  window.localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
}

function readCategories(): StoredCategory[] {
  if (!hasLocalStorage()) {
    return []
  }

  ensureInitialSeed()

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCategories(categories: StoredCategory[]) {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase('pt-BR')
}

function validateName(name: string) {
  if (!name.trim()) {
    throw new Error('Nome da categoria é obrigatório.')
  }
}

function ensureNoDuplicate(categories: StoredCategory[], candidate: { id?: string; name: string; costType: CostType; dreGroup: DreGroup }) {
  const normalized = normalizeName(candidate.name)
  const duplicate = categories.find((category) => {
    if (candidate.id && category.id === candidate.id) {
      return false
    }

    return (
      category.costType === candidate.costType &&
      category.dreGroup === candidate.dreGroup &&
      normalizeName(category.name) === normalized
    )
  })

  if (duplicate) {
    throw new Error('Já existe categoria com esse nome para o mesmo tipo e natureza.')
  }
}

interface CategoryFilters {
  costType?: CostType
  dreGroup?: DreGroup
}

export function listCategories(filters: CategoryFilters = {}) {
  const { costType, dreGroup } = filters

  return readCategories()
    .filter((category) => {
      if (costType && category.costType !== costType) {
        return false
      }

      if (dreGroup && category.dreGroup !== dreGroup) {
        return false
      }

      return true
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
}

export function getCategoryById(categoryId: string) {
  return readCategories().find((category) => category.id === categoryId) ?? null
}

interface CreateCategoryInput {
  name: string
  costType: CostType
  dreGroup: DreGroup
}

export function createCategory(input: CreateCategoryInput) {
  validateName(input.name)

  const categories = readCategories()
  ensureNoDuplicate(categories, input)

  const now = new Date().toISOString()
  const nextCategory: StoredCategory = {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `cat-${Date.now()}`,
    name: input.name.trim(),
    costType: input.costType,
    dreGroup: input.dreGroup,
    createdAt: now,
    updatedAt: now,
  }

  writeCategories([...categories, nextCategory])
  return nextCategory
}

interface UpdateCategoryInput {
  name: string
  costType: CostType
  dreGroup: DreGroup
}

export function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  validateName(input.name)

  const categories = readCategories()
  const index = categories.findIndex((category) => category.id === categoryId)
  if (index === -1) {
    throw new Error('Categoria não encontrada.')
  }

  ensureNoDuplicate(categories, { id: categoryId, ...input })

  const current = categories[index]
  const nextCategory: StoredCategory = {
    ...current,
    name: input.name.trim(),
    costType: input.costType,
    dreGroup: input.dreGroup,
    updatedAt: new Date().toISOString(),
  }

  const nextCategories = [...categories]
  nextCategories[index] = nextCategory
  writeCategories(nextCategories)
  return nextCategory
}

export function deleteCategory(categoryId: string) {
  const categories = readCategories()
  const nextCategories = categories.filter((category) => category.id !== categoryId)
  writeCategories(nextCategories)
}
