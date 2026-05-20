import { createDreLineInput, type DreLineInput } from './calculations'

const STORAGE_KEY = 'empresa-facil:launch-entries:v1'

export interface StoredLaunchEntry {
  id: string
  companyId: string
  month: string
  costType: 'company' | 'personal'
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
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
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
  writeEntries([...current, entry])
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
        dreGroup: 'expenses',
        description: entry.description,
      })
    )
}
