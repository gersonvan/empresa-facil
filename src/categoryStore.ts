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

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readCategories(): StoredCategory[] {
  if (!hasLocalStorage()) {
    return []
  }

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
