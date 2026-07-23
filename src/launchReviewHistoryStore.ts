export type LaunchReviewAction = 'approved' | 'excluded_as_internal_transfer' | 'edited'

export interface LaunchReviewHistoryEntry {
  id: string
  entryId: string
  companyId: string
  action: LaunchReviewAction
  reason: string
  actorRole: 'owner'
  at: string
}

const STORAGE_KEY = 'empresa-facil:launch-review-history:v1'

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readEntries(): LaunchReviewHistoryEntry[] {
  if (!hasLocalStorage()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed as LaunchReviewHistoryEntry[] : []
  } catch {
    return []
  }
}

export function registerLaunchReview(input: Omit<LaunchReviewHistoryEntry, 'id' | 'actorRole' | 'at'>) {
  if (!hasLocalStorage()) return null
  const entry: LaunchReviewHistoryEntry = {
    ...input,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `review-${Date.now()}`,
    actorRole: 'owner',
    at: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...readEntries(), entry]))
  return entry
}

export function listLaunchReviewHistory(companyId: string, entryId?: string) {
  return readEntries()
    .filter((item) => item.companyId === companyId && (!entryId || item.entryId === entryId))
    .sort((left, right) => right.at.localeCompare(left.at))
}
