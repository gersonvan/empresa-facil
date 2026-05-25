export interface StoredDeductionReconciliation {
  companyId: string
  month: string
  estimatedTotalDeductions: number
  actualTotalDeductions: number
  adjustmentValue: number
  status: 'open' | 'reconciled'
  reviewedBy: string
  reviewedAt: string
  notes: string
}

const STORAGE_KEY = 'empresa-facil:deduction-reconciliation:v1'

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeRecord(input: unknown): StoredDeductionReconciliation | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const partial = input as Partial<StoredDeductionReconciliation>
  const companyId = typeof partial.companyId === 'string' ? partial.companyId.trim() : ''
  const month = typeof partial.month === 'string' ? partial.month.trim() : ''

  if (!companyId || !month) {
    return null
  }

  return {
    companyId,
    month,
    estimatedTotalDeductions: Number(partial.estimatedTotalDeductions) || 0,
    actualTotalDeductions: Number(partial.actualTotalDeductions) || 0,
    adjustmentValue: Number(partial.adjustmentValue) || 0,
    status: partial.status === 'reconciled' ? 'reconciled' : 'open',
    reviewedBy: typeof partial.reviewedBy === 'string' ? partial.reviewedBy : 'owner',
    reviewedAt: typeof partial.reviewedAt === 'string' ? partial.reviewedAt : new Date().toISOString(),
    notes: typeof partial.notes === 'string' ? partial.notes : '',
  }
}

function readRecords() {
  if (!hasLocalStorage()) {
    return [] as StoredDeductionReconciliation[]
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return [] as StoredDeductionReconciliation[]
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return [] as StoredDeductionReconciliation[]
    }

    return parsed.map((item) => normalizeRecord(item)).filter(Boolean) as StoredDeductionReconciliation[]
  } catch {
    return [] as StoredDeductionReconciliation[]
  }
}

function writeRecords(records: StoredDeductionReconciliation[]) {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function getDeductionReconciliation(companyId: string, month: string) {
  const normalizedCompanyId = companyId.trim()
  const normalizedMonth = month.trim()
  if (!normalizedCompanyId || !normalizedMonth) {
    return null
  }

  return (
    readRecords().find(
      (record) => record.companyId === normalizedCompanyId && record.month === normalizedMonth
    ) ?? null
  )
}

interface SaveDeductionReconciliationInput {
  companyId: string
  month: string
  estimatedTotalDeductions: number
  actualTotalDeductions: number
  adjustmentValue: number
  status: 'open' | 'reconciled'
  reviewedBy?: string
  notes?: string
}

export function saveDeductionReconciliation(input: SaveDeductionReconciliationInput) {
  const companyId = input.companyId.trim()
  const month = input.month.trim()

  if (!companyId || !month) {
    throw new Error('companyId e month são obrigatórios para salvar a reconciliação.')
  }

  const records = readRecords()
  const index = records.findIndex((record) => record.companyId === companyId && record.month === month)
  const now = new Date().toISOString()

  const nextRecord: StoredDeductionReconciliation = {
    companyId,
    month,
    estimatedTotalDeductions: Number(input.estimatedTotalDeductions) || 0,
    actualTotalDeductions: Number(input.actualTotalDeductions) || 0,
    adjustmentValue: Number(input.adjustmentValue) || 0,
    status: input.status,
    reviewedBy: input.reviewedBy?.trim() || 'owner',
    reviewedAt: now,
    notes: input.notes?.trim() || '',
  }

  if (index === -1) {
    writeRecords([...records, nextRecord])
    return nextRecord
  }

  const next = [...records]
  next[index] = nextRecord
  writeRecords(next)
  return nextRecord
}
