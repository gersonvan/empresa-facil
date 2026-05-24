import { createDreLineInput, type DreLineInput } from './calculations'
import type { DreGroup } from './categoryStore'

const STORAGE_KEY = 'empresa-facil:launch-entries:v1'

export interface StoredLaunchEntry {
  id: string
  companyId: string
  month: string
  costType: 'company' | 'personal'
  dreGroup: DreGroup
  categoryId: string
  categoryName: string
  description: string
  amount: number
  createdAt: string
}

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readEntries(): StoredLaunchEntry[] {
  if (!hasLocalStorage()) {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((entry) => normalizeEntry(entry)).filter(Boolean) as StoredLaunchEntry[]
  } catch {
    return []
  }
}

function normalizeEntry(entry: unknown): StoredLaunchEntry | null {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const input = entry as Partial<StoredLaunchEntry>
  if (!input.id || !input.companyId || !input.month || !input.costType || !input.description) {
    return null
  }

  return {
    id: String(input.id),
    companyId: String(input.companyId),
    month: String(input.month),
    costType: input.costType === 'personal' ? 'personal' : 'company',
    dreGroup: input.dreGroup === 'revenue' ? 'revenue' : 'expenses',
    categoryId: input.categoryId ? String(input.categoryId) : 'uncategorized',
    categoryName: input.categoryName ? String(input.categoryName) : 'Sem categoria',
    description: String(input.description),
    amount: Number(input.amount) || 0,
    createdAt: input.createdAt ? String(input.createdAt) : new Date().toISOString(),
  }
}

function writeEntries(entries: StoredLaunchEntry[]) {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function saveLaunchEntry(entry: StoredLaunchEntry) {
  const current = readEntries()
  writeEntries([...current, normalizeEntry(entry) as StoredLaunchEntry])
}

export function getLaunchEntryById(entryId: string) {
  return readEntries().find((entry) => entry.id === entryId) ?? null
}

export function updateLaunchEntry(entryId: string, update: Partial<StoredLaunchEntry>) {
  const current = readEntries()
  const index = current.findIndex((entry) => entry.id === entryId)
  if (index === -1) {
    throw new Error('Lançamento não encontrado.')
  }

  const nextEntry = normalizeEntry({
    ...current[index],
    ...update,
    id: current[index].id,
    companyId: current[index].companyId,
    month: current[index].month,
    createdAt: current[index].createdAt,
  })

  if (!nextEntry) {
    throw new Error('Falha ao atualizar lançamento.')
  }

  const next = [...current]
  next[index] = nextEntry
  writeEntries(next)
  return nextEntry
}

export function removeLaunchEntry(entryId: string) {
  const current = readEntries()
  writeEntries(current.filter((entry) => entry.id !== entryId))
}

interface ListLaunchEntriesFilters {
  companyId?: string
  month?: string
  costType?: 'company' | 'personal' | 'all'
}

export function listLaunchEntries(filters: ListLaunchEntriesFilters = {}) {
  const { companyId, month, costType = 'all' } = filters

  return readEntries()
    .filter((entry) => {
      if (companyId && entry.companyId !== companyId) {
        return false
      }

      if (month && entry.month !== month) {
        return false
      }

      if (costType !== 'all' && entry.costType !== costType) {
        return false
      }

      return true
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export function listLaunchLines({ companyId, month }: { companyId: string; month: string }): DreLineInput[] {
  return listLaunchEntries({ companyId, month })
    .map((entry) =>
      createDreLineInput({
        entryId: entry.id,
        companyId: entry.companyId,
        month: entry.month,
        amount: entry.amount,
        dreGroup: entry.dreGroup,
        description: entry.description,
      })
    )
}
