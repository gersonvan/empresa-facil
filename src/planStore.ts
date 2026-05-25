import { listCategories, type CostType, type DreGroup } from './categoryStore'

export type PlanGroupKey = 'company-revenue' | 'personal-revenue' | 'company-expenses' | 'personal-expenses'

export interface PlanGroupConfig {
  key: PlanGroupKey
  title: string
  costType: CostType
  dreGroup: DreGroup
}

export interface PlanGroupState {
  key: PlanGroupKey
  title: string
  costType: CostType
  dreGroup: DreGroup
  categoryIds: string[]
}

const STORAGE_KEY = 'empresa-facil:plan-of-accounts:v1'

export const PLAN_GROUPS: PlanGroupConfig[] = [
  { key: 'company-revenue', title: 'Receitas Empresariais', costType: 'company', dreGroup: 'revenue' },
  { key: 'personal-revenue', title: 'Receitas Pessoais', costType: 'personal', dreGroup: 'revenue' },
  { key: 'company-expenses', title: 'Despesas Empresariais', costType: 'company', dreGroup: 'expenses' },
  { key: 'personal-expenses', title: 'Despesas Pessoais', costType: 'personal', dreGroup: 'expenses' },
]

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function buildDefaultState(): Record<PlanGroupKey, string[]> {
  return PLAN_GROUPS.reduce<Record<PlanGroupKey, string[]>>((accumulator, group) => {
    accumulator[group.key] = listCategories({
      costType: group.costType,
      dreGroup: group.dreGroup,
    }).map((category) => category.id)
    return accumulator
  }, {} as Record<PlanGroupKey, string[]>)
}

function normalizeState(state: unknown): Record<PlanGroupKey, string[]> {
  const defaults = buildDefaultState()

  if (!state || typeof state !== 'object') {
    return defaults
  }

  const input = state as Partial<Record<PlanGroupKey, unknown>>
  return PLAN_GROUPS.reduce<Record<PlanGroupKey, string[]>>((accumulator, group) => {
    const rawIds = input[group.key]
    const currentCategoryIds = new Set(
      listCategories({
        costType: group.costType,
        dreGroup: group.dreGroup,
      }).map((category) => category.id)
    )

    const baseIds = Array.isArray(rawIds) ? rawIds.map((value) => String(value)) : defaults[group.key]
    const cleaned = baseIds.filter((categoryId, index, array) => currentCategoryIds.has(categoryId) && array.indexOf(categoryId) === index)

    const fallbackIds = defaults[group.key].filter((categoryId) => !cleaned.includes(categoryId))
    accumulator[group.key] = [...cleaned, ...fallbackIds]
    return accumulator
  }, {} as Record<PlanGroupKey, string[]>)
}

function readState(): Record<PlanGroupKey, string[]> {
  if (!hasLocalStorage()) {
    return buildDefaultState()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const defaults = buildDefaultState()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    return defaults
  }

  try {
    return normalizeState(JSON.parse(raw))
  } catch {
    return buildDefaultState()
  }
}

function writeState(state: Record<PlanGroupKey, string[]>) {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function saveState(nextState: Record<PlanGroupKey, string[]>) {
  writeState(nextState)
  return getPlanGroups(nextState)
}

function getCurrentCategoryIds(group: PlanGroupConfig, state: Record<PlanGroupKey, string[]>) {
  const validCategoryIds = new Set(
    listCategories({ costType: group.costType, dreGroup: group.dreGroup }).map((category) => category.id)
  )

  return state[group.key].filter((categoryId) => validCategoryIds.has(categoryId))
}

export function getPlanGroups(stateOverride?: Record<PlanGroupKey, string[]>): PlanGroupState[] {
  const state = normalizeState(stateOverride ?? readState())

  return PLAN_GROUPS.map((group) => ({
    ...group,
    categoryIds: getCurrentCategoryIds(group, state),
  }))
}

export function getPlanGroup(groupKey: PlanGroupKey) {
  return getPlanGroups().find((group) => group.key === groupKey) ?? null
}

export function getAvailableCategoriesForGroup(groupKey: PlanGroupKey) {
  const group = PLAN_GROUPS.find((item) => item.key === groupKey)
  if (!group) {
    return []
  }

  const categories = listCategories({
    costType: group.costType,
    dreGroup: group.dreGroup,
  })

  const currentIds = new Set(getPlanGroups().find((item) => item.key === groupKey)?.categoryIds ?? [])
  return categories.filter((category) => !currentIds.has(category.id))
}

export function addCategoryToGroup(groupKey: PlanGroupKey, categoryId: string) {
  const state = readState()
  const group = PLAN_GROUPS.find((item) => item.key === groupKey)
  if (!group) {
    throw new Error('Grupo do plano não encontrado.')
  }

  const currentIds = getCurrentCategoryIds(group, state)
  if (currentIds.includes(categoryId)) {
    return saveState(state)
  }

  const availableIds = new Set(
    listCategories({ costType: group.costType, dreGroup: group.dreGroup }).map((category) => category.id)
  )
  if (!availableIds.has(categoryId)) {
    throw new Error('Categoria inválida para este grupo.')
  }

  state[groupKey] = [...currentIds, categoryId]
  return saveState(state)
}

export function removeCategoryFromGroup(groupKey: PlanGroupKey, categoryId: string) {
  const state = readState()
  const group = PLAN_GROUPS.find((item) => item.key === groupKey)
  if (!group) {
    throw new Error('Grupo do plano não encontrado.')
  }

  state[groupKey] = getCurrentCategoryIds(group, state).filter((item) => item !== categoryId)
  return saveState(state)
}

export function moveCategoryWithinGroup(groupKey: PlanGroupKey, fromIndex: number, toIndex: number) {
  const state = readState()
  const group = PLAN_GROUPS.find((item) => item.key === groupKey)
  if (!group) {
    throw new Error('Grupo do plano não encontrado.')
  }

  const items = [...getCurrentCategoryIds(group, state)]
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return saveState(state)
  }

  const [moved] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, moved)
  state[groupKey] = items
  return saveState(state)
}

export function resetPlanToDefaults() {
  const defaults = buildDefaultState()
  writeState(defaults)
  return getPlanGroups(defaults)
}
