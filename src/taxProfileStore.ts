export interface StoredTaxProfile {
  companyId: string
  taxationMode: 'estimated_generic'
  annualRevenueForecast: number
  reviewPolicy: 'monthly_required'
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'empresa-facil:tax-profile:v1'

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeProfile(input: unknown): StoredTaxProfile | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const partial = input as Partial<StoredTaxProfile>
  const companyId = typeof partial.companyId === 'string' ? partial.companyId.trim() : ''
  const annualRevenueForecast = Number(partial.annualRevenueForecast)

  if (!companyId || !Number.isFinite(annualRevenueForecast) || annualRevenueForecast <= 0) {
    return null
  }

  const now = new Date().toISOString()

  return {
    companyId,
    taxationMode: 'estimated_generic',
    annualRevenueForecast,
    reviewPolicy: 'monthly_required',
    createdAt: typeof partial.createdAt === 'string' ? partial.createdAt : now,
    updatedAt: typeof partial.updatedAt === 'string' ? partial.updatedAt : now,
  }
}

function readProfiles() {
  if (!hasLocalStorage()) {
    return [] as StoredTaxProfile[]
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return [] as StoredTaxProfile[]
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return [] as StoredTaxProfile[]
    }

    return parsed.map((item) => normalizeProfile(item)).filter(Boolean) as StoredTaxProfile[]
  } catch {
    return [] as StoredTaxProfile[]
  }
}

function writeProfiles(profiles: StoredTaxProfile[]) {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

export function listTaxProfiles() {
  return readProfiles().sort((left, right) => left.companyId.localeCompare(right.companyId, 'pt-BR'))
}

export function getTaxProfile(companyId: string) {
  const normalizedCompanyId = companyId.trim()
  if (!normalizedCompanyId) {
    return null
  }

  return readProfiles().find((profile) => profile.companyId === normalizedCompanyId) ?? null
}

interface UpsertTaxProfileInput {
  companyId: string
  annualRevenueForecast: number
}

export function upsertTaxProfile(input: UpsertTaxProfileInput) {
  const companyId = input.companyId.trim()
  const annualRevenueForecast = Number(input.annualRevenueForecast)

  if (!companyId) {
    throw new Error('companyId é obrigatório para salvar o perfil tributário.')
  }

  if (!Number.isFinite(annualRevenueForecast) || annualRevenueForecast <= 0) {
    throw new Error('annualRevenueForecast deve ser maior que zero.')
  }

  const profiles = readProfiles()
  const index = profiles.findIndex((profile) => profile.companyId === companyId)
  const now = new Date().toISOString()

  if (index === -1) {
    const nextProfile: StoredTaxProfile = {
      companyId,
      taxationMode: 'estimated_generic',
      annualRevenueForecast,
      reviewPolicy: 'monthly_required',
      createdAt: now,
      updatedAt: now,
    }

    writeProfiles([...profiles, nextProfile])
    return nextProfile
  }

  const nextProfile: StoredTaxProfile = {
    ...profiles[index],
    annualRevenueForecast,
    updatedAt: now,
  }

  const next = [...profiles]
  next[index] = nextProfile
  writeProfiles(next)
  return nextProfile
}

export function removeTaxProfile(companyId: string) {
  const normalizedCompanyId = companyId.trim()
  if (!normalizedCompanyId) {
    return
  }

  const profiles = readProfiles()
  writeProfiles(profiles.filter((profile) => profile.companyId !== normalizedCompanyId))
}
