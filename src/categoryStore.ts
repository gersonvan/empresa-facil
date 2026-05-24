export type CostType = 'company' | 'personal'
export type DreGroup = 'revenue' | 'expenses'

export interface StoredCategory {
  id: string
  name: string
  costType: CostType
  dreGroup: DreGroup
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'empresa-facil:categories:v1'

const presetCategories: StoredCategory[] = [
  { id: 'cat-company-revenue-sales', name: 'Vendas', costType: 'company', dreGroup: 'revenue', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-revenue-services', name: 'Prestacao de servicos', costType: 'company', dreGroup: 'revenue', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-revenue-financial', name: 'Receitas financeiras', costType: 'company', dreGroup: 'revenue', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-expenses-payroll', name: 'Folha e pro-labore', costType: 'company', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-expenses-rent', name: 'Aluguel e condominio', costType: 'company', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-expenses-marketing', name: 'Marketing e publicidade', costType: 'company', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-expenses-software', name: 'Software e assinaturas', costType: 'company', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-expenses-utilities', name: 'Internet, energia e agua', costType: 'company', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-expenses-logistics', name: 'Frete e deslocamentos', costType: 'company', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-company-expenses-taxes', name: 'Impostos e taxas', costType: 'company', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-personal-revenue-salary', name: 'Salario', costType: 'personal', dreGroup: 'revenue', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-personal-revenue-freelance', name: 'Freelas e extras', costType: 'personal', dreGroup: 'revenue', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-personal-expenses-housing', name: 'Moradia', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-personal-expenses-food', name: 'Alimentacao', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-personal-expenses-transport', name: 'Transporte', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
  { id: 'cat-personal-expenses-health', name: 'Saude', costType: 'personal', dreGroup: 'expenses', createdAt: '2026-05-24T00:00:00.000Z', updatedAt: '2026-05-24T00:00:00.000Z' },
]

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readCategories(): StoredCategory[] {
  if (!hasLocalStorage()) {
    return [...presetCategories]
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presetCategories))
    return [...presetCategories]
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [...presetCategories]
  } catch {
    return [...presetCategories]
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
    throw new Error('Nome da categoria e obrigatorio.')
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
    throw new Error('Ja existe categoria com esse nome para o mesmo tipo e natureza.')
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
    throw new Error('Categoria nao encontrada.')
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
