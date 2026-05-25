export interface StoredDeductionBracket {
  id: string
  minAnnualRevenue: number
  maxAnnualRevenue: number
  estimatedDeductionRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'empresa-facil:deduction-brackets:v1'

const DEFAULT_BRACKETS: StoredDeductionBracket[] = [
  {
    id: 'ded-bracket-01',
    minAnnualRevenue: 0,
    maxAnnualRevenue: 180000,
    estimatedDeductionRate: 6,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'ded-bracket-02',
    minAnnualRevenue: 180000.01,
    maxAnnualRevenue: 360000,
    estimatedDeductionRate: 8,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'ded-bracket-03',
    minAnnualRevenue: 360000.01,
    maxAnnualRevenue: 720000,
    estimatedDeductionRate: 10,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'ded-bracket-04',
    minAnnualRevenue: 720000.01,
    maxAnnualRevenue: 1000000,
    estimatedDeductionRate: 12,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeBracket(input: unknown): StoredDeductionBracket | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const partial = input as Partial<StoredDeductionBracket>
  const minAnnualRevenue = Number(partial.minAnnualRevenue)
  const maxAnnualRevenue = Number(partial.maxAnnualRevenue)
  const estimatedDeductionRate = Number(partial.estimatedDeductionRate)
  const id = typeof partial.id === 'string' ? partial.id.trim() : ''

  if (!id || !Number.isFinite(minAnnualRevenue) || !Number.isFinite(maxAnnualRevenue)) {
    return null
  }

  if (!Number.isFinite(estimatedDeductionRate) || estimatedDeductionRate < 0) {
    return null
  }

  if (minAnnualRevenue > maxAnnualRevenue) {
    return null
  }

  const now = new Date().toISOString()

  return {
    id,
    minAnnualRevenue,
    maxAnnualRevenue,
    estimatedDeductionRate,
    isActive: partial.isActive !== false,
    createdAt: typeof partial.createdAt === 'string' ? partial.createdAt : now,
    updatedAt: typeof partial.updatedAt === 'string' ? partial.updatedAt : now,
  }
}

function sortBrackets(brackets: StoredDeductionBracket[]) {
  return [...brackets].sort((left, right) => {
    if (left.minAnnualRevenue !== right.minAnnualRevenue) {
      return left.minAnnualRevenue - right.minAnnualRevenue
    }

    return left.maxAnnualRevenue - right.maxAnnualRevenue
  })
}

function validateBrackets(brackets: StoredDeductionBracket[]) {
  const active = sortBrackets(brackets.filter((bracket) => bracket.isActive))

  for (let index = 0; index < active.length - 1; index += 1) {
    const current = active[index]
    const next = active[index + 1]

    if (current.maxAnnualRevenue >= next.minAnnualRevenue) {
      throw new Error('Faixas ativas não podem se sobrepor.')
    }
  }
}

function readBrackets() {
  if (!hasLocalStorage()) {
    return DEFAULT_BRACKETS
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRACKETS))
    return DEFAULT_BRACKETS
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRACKETS))
      return DEFAULT_BRACKETS
    }

    const normalized = parsed
      .map((item) => normalizeBracket(item))
      .filter(Boolean) as StoredDeductionBracket[]

    if (normalized.length === 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRACKETS))
      return DEFAULT_BRACKETS
    }

    return normalized
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRACKETS))
    return DEFAULT_BRACKETS
  }
}

function writeBrackets(brackets: StoredDeductionBracket[]) {
  validateBrackets(brackets)

  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(brackets))
}

export function listDeductionBrackets() {
  return sortBrackets(readBrackets())
}

interface UpsertDeductionBracketInput {
  id?: string
  minAnnualRevenue: number
  maxAnnualRevenue: number
  estimatedDeductionRate: number
  isActive?: boolean
}

export function upsertDeductionBracket(input: UpsertDeductionBracketInput) {
  const minAnnualRevenue = Number(input.minAnnualRevenue)
  const maxAnnualRevenue = Number(input.maxAnnualRevenue)
  const estimatedDeductionRate = Number(input.estimatedDeductionRate)

  if (!Number.isFinite(minAnnualRevenue) || !Number.isFinite(maxAnnualRevenue)) {
    throw new Error('Faixa anual inválida.')
  }

  if (minAnnualRevenue > maxAnnualRevenue) {
    throw new Error('minAnnualRevenue não pode ser maior que maxAnnualRevenue.')
  }

  if (!Number.isFinite(estimatedDeductionRate) || estimatedDeductionRate < 0) {
    throw new Error('estimatedDeductionRate deve ser um número não negativo.')
  }

  const brackets = readBrackets()
  const now = new Date().toISOString()
  const bracketId = input.id?.trim() || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ded-bracket-${Date.now()}`)
  const index = brackets.findIndex((bracket) => bracket.id === bracketId)

  if (index === -1) {
    const nextBracket: StoredDeductionBracket = {
      id: bracketId,
      minAnnualRevenue,
      maxAnnualRevenue,
      estimatedDeductionRate,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now,
    }

    const next = [...brackets, nextBracket]
    writeBrackets(next)
    return nextBracket
  }

  const nextBracket: StoredDeductionBracket = {
    ...brackets[index],
    minAnnualRevenue,
    maxAnnualRevenue,
    estimatedDeductionRate,
    isActive: input.isActive !== false,
    updatedAt: now,
  }

  const next = [...brackets]
  next[index] = nextBracket
  writeBrackets(next)
  return nextBracket
}

export function removeDeductionBracket(bracketId: string) {
  const normalizedId = bracketId.trim()
  if (!normalizedId) {
    return
  }

  const brackets = readBrackets()
  const next = brackets.filter((bracket) => bracket.id !== normalizedId)
  writeBrackets(next)
}

export function matchDeductionBracket(annualRevenueForecast: number) {
  const value = Number(annualRevenueForecast)
  if (!Number.isFinite(value) || value < 0) {
    return null
  }

  const brackets = listDeductionBrackets().filter((bracket) => bracket.isActive)
  return (
    brackets.find(
      (bracket) => value >= bracket.minAnnualRevenue && value <= bracket.maxAnnualRevenue
    ) ?? null
  )
}
