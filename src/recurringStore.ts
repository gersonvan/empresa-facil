import type { DreGroup } from './categoryStore'
import type { AccountOrigin } from './launchStore'

const STORAGE_KEY = 'empresa-facil:recurring-templates:v1'

export interface RecurringTemplate {
  id: string
  companyId: string
  costType: 'company' | 'personal'
  accountOrigin?: AccountOrigin
  dreGroup: DreGroup
  categoryId: string
  categoryName: string
  description: string
  amount: number
  createdAt: string
}

function read(): RecurringTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(templates: RecurringTemplate[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function saveRecurringTemplate(template: RecurringTemplate) {
  const current = read()
  const withoutDuplicate = current.filter((t) => t.id !== template.id)
  write([...withoutDuplicate, template])
}

export function listRecurringTemplates(filters: { companyId?: string } = {}): RecurringTemplate[] {
  return read().filter((t) => !filters.companyId || t.companyId === filters.companyId)
}

export function removeRecurringTemplate(id: string) {
  write(read().filter((t) => t.id !== id))
}
