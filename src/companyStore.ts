export interface StoredCompany {
  id: string
  name: string
  cnpj?: string
  segment?: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

const COMPANIES_STORAGE_KEY = 'empresa-facil:companies:v1'
const ACTIVE_COMPANY_STORAGE_KEY = 'empresa-facil:active-company-id:v1'
const LEGACY_ACTIVE_COMPANY_STORAGE_KEY = 'empresa-facil:active-company-id'
const ACTIVE_COMPANY_CHANGED_EVENT = 'empresa-facil:active-company-changed'
const LAUNCH_ENTRIES_STORAGE_KEY = 'empresa-facil:launch-entries:v1'
const TAX_PROFILE_STORAGE_KEY = 'empresa-facil:tax-profile:v1'
const RECONCILIATION_STORAGE_KEY = 'empresa-facil:deduction-reconciliation:v1'
const MONTH_LIFECYCLE_STORAGE_KEY = 'empresa-facil:month-lifecycle:v1'

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function nextCompanyId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `company-${crypto.randomUUID()}`
  }

  return `company-${Date.now()}`
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCnpj(value: string) {
  return value.replace(/\D/g, '')
}

function readArrayFromStorage(storageKey: string) {
  if (!hasLocalStorage()) {
    return [] as unknown[]
  }

  const raw = window.localStorage.getItem(storageKey)
  if (!raw) {
    return [] as unknown[]
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [] as unknown[]
  }
}

function readObjectFromStorage(storageKey: string) {
  if (!hasLocalStorage()) {
    return {} as Record<string, unknown>
  }

  const raw = window.localStorage.getItem(storageKey)
  if (!raw) {
    return {} as Record<string, unknown>
  }

  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return {} as Record<string, unknown>
  } catch {
    return {} as Record<string, unknown>
  }
}

function collectLegacyCompanyIds() {
  const ids = new Set<string>()

  if (!hasLocalStorage()) {
    return ids
  }

  const activeCompanyId = cleanText(window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY))
  if (activeCompanyId) {
    ids.add(activeCompanyId)
  }

  const legacyActiveCompanyId = cleanText(window.localStorage.getItem(LEGACY_ACTIVE_COMPANY_STORAGE_KEY))
  if (legacyActiveCompanyId) {
    ids.add(legacyActiveCompanyId)
  }

  for (const item of readArrayFromStorage(LAUNCH_ENTRIES_STORAGE_KEY)) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const entry = item as { companyId?: unknown }
    const companyId = cleanText(entry.companyId)
    if (companyId) {
      ids.add(companyId)
    }
  }

  for (const item of readArrayFromStorage(TAX_PROFILE_STORAGE_KEY)) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const profile = item as { companyId?: unknown }
    const companyId = cleanText(profile.companyId)
    if (companyId) {
      ids.add(companyId)
    }
  }

  for (const item of readArrayFromStorage(RECONCILIATION_STORAGE_KEY)) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const record = item as { companyId?: unknown }
    const companyId = cleanText(record.companyId)
    if (companyId) {
      ids.add(companyId)
    }
  }

  const lifecycleState = readObjectFromStorage(MONTH_LIFECYCLE_STORAGE_KEY)
  for (const stateKey of Object.keys(lifecycleState)) {
    const companyId = cleanText(stateKey.split(':')[0])
    if (companyId) {
      ids.add(companyId)
    }
  }

  return ids
}

function createLegacyCompanyName(companyId: string, order: number) {
  return `Empresa migrada ${String(order + 1).padStart(2, '0')} (${companyId})`
}

function mergeLegacyCompanyIds(companies: StoredCompany[]) {
  const ids = collectLegacyCompanyIds()
  const known = new Set(companies.map((company) => company.id))

  if (ids.size === 0) {
    return {
      changed: false,
      companies,
    }
  }

  const next = [...companies]
  const now = new Date().toISOString()

  for (const companyId of ids) {
    if (known.has(companyId)) {
      continue
    }

    next.push({
      id: companyId,
      name: createLegacyCompanyName(companyId, next.length),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    known.add(companyId)
  }

  return {
    changed: next.length !== companies.length,
    companies: next,
  }
}

function normalizeCompany(input: unknown): StoredCompany | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const partial = input as Partial<StoredCompany>
  const id = cleanText(partial.id)
  const name = cleanText(partial.name)

  if (!id || !name) {
    return null
  }

  const cnpj = normalizeCnpj(cleanText(partial.cnpj))
  const segment = cleanText(partial.segment)
  const now = new Date().toISOString()

  return {
    id,
    name,
    cnpj: cnpj || undefined,
    segment: segment || undefined,
    status: partial.status === 'archived' ? 'archived' : 'active',
    createdAt: cleanText(partial.createdAt) || now,
    updatedAt: cleanText(partial.updatedAt) || now,
  }
}

function writeCompanies(companies: StoredCompany[]) {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies))
}

function bootstrapCompanies(): StoredCompany[] {
  if (!hasLocalStorage()) {
    const now = new Date().toISOString()
    const memorySeed: StoredCompany[] = [
      {
        id: nextCompanyId(),
        name: 'Empresa principal',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ]

    return memorySeed
  }

  const now = new Date().toISOString()
  const seedIds = [...collectLegacyCompanyIds()]
  if (seedIds.length === 0) {
    seedIds.push(nextCompanyId())
  }

  const defaultCompanies: StoredCompany[] = seedIds.map((companyId, index) => ({
    id: companyId,
    name: index === 0 ? 'Empresa principal' : createLegacyCompanyName(companyId, index),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }))

  const preferredActiveId = cleanText(window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY))
  const activeId = preferredActiveId || seedIds[0]

  writeCompanies(defaultCompanies)
  window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, activeId)
  return defaultCompanies
}

function readCompanies() {
  if (!hasLocalStorage()) {
    return bootstrapCompanies()
  }

  const raw = window.localStorage.getItem(COMPANIES_STORAGE_KEY)
  if (!raw) {
    return bootstrapCompanies()
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return bootstrapCompanies()
    }

    const companies = parsed
      .map((item) => normalizeCompany(item))
      .filter(Boolean) as StoredCompany[]

    if (companies.length === 0) {
      return bootstrapCompanies()
    }

    const merged = mergeLegacyCompanyIds(companies)
    if (merged.changed) {
      writeCompanies(merged.companies)
      return merged.companies
    }

    return companies
  } catch {
    return bootstrapCompanies()
  }
}

function dispatchActiveCompanyChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(ACTIVE_COMPANY_CHANGED_EVENT))
}

function ensureActiveCompany(companies: StoredCompany[]) {
  const activeCompanies = companies.filter((company) => company.status === 'active')
  if (activeCompanies.length === 0) {
    throw new Error('É necessário manter pelo menos uma empresa ativa.')
  }

  const currentActiveCompanyId = getActiveCompanyId()
  const stillValid = activeCompanies.some((company) => company.id === currentActiveCompanyId)

  if (stillValid) {
    return
  }

  setActiveCompany(activeCompanies[0].id)
}

interface ListCompaniesFilters {
  includeArchived?: boolean
}

export function listCompanies(filters: ListCompaniesFilters = {}) {
  const { includeArchived = false } = filters
  const companies = readCompanies()

  const filtered = includeArchived
    ? companies
    : companies.filter((company) => company.status === 'active')

  return filtered.sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
}

export function getCompanyById(companyId: string) {
  const normalizedId = cleanText(companyId)
  if (!normalizedId) {
    return null
  }

  return readCompanies().find((company) => company.id === normalizedId) ?? null
}

export function getActiveCompanyId() {
  const companies = readCompanies()

  if (!hasLocalStorage()) {
    return companies[0].id
  }

  const stored = cleanText(window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY))
  if (stored && companies.some((company) => company.id === stored && company.status === 'active')) {
    return stored
  }

  const firstActive = companies.find((company) => company.status === 'active')
  if (!firstActive) {
    throw new Error('Nenhuma empresa ativa disponível.')
  }

  window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, firstActive.id)
  return firstActive.id
}

export function getActiveCompany() {
  const activeCompanyId = getActiveCompanyId()
  return getCompanyById(activeCompanyId)
}

interface CreateCompanyInput {
  name: string
  cnpj?: string
  segment?: string
}

export function createCompany(input: CreateCompanyInput) {
  const name = cleanText(input.name)
  const cnpj = normalizeCnpj(cleanText(input.cnpj))
  const segment = cleanText(input.segment)

  if (!name) {
    throw new Error('Informe o nome da empresa.')
  }

  const companies = readCompanies()
  const duplicatedName = companies.some((company) => company.name.toLowerCase() === name.toLowerCase())
  if (duplicatedName) {
    throw new Error('Já existe uma empresa com este nome.')
  }

  const duplicatedCnpj = cnpj
    ? companies.some((company) => normalizeCnpj(cleanText(company.cnpj)) === cnpj)
    : false
  if (duplicatedCnpj) {
    throw new Error('Já existe uma empresa com este CNPJ.')
  }

  if (cnpj && cnpj.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos quando informado.')
  }

  const now = new Date().toISOString()
  const nextCompany: StoredCompany = {
    id: nextCompanyId(),
    name,
    cnpj: cnpj || undefined,
    segment: segment || undefined,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }

  const next = [...companies, nextCompany]
  writeCompanies(next)
  return nextCompany
}

interface UpdateCompanyInput {
  name?: string
  cnpj?: string
  segment?: string
  status?: 'active' | 'archived'
}

export function updateCompany(companyId: string, update: UpdateCompanyInput) {
  const normalizedId = cleanText(companyId)
  if (!normalizedId) {
    throw new Error('Empresa inválida para atualização.')
  }

  const companies = readCompanies()
  const index = companies.findIndex((company) => company.id === normalizedId)
  if (index === -1) {
    throw new Error('Empresa não encontrada.')
  }

  const current = companies[index]
  const nextName = cleanText(update.name ?? current.name)
  const nextCnpj = normalizeCnpj(cleanText(update.cnpj ?? current.cnpj ?? ''))
  const nextSegment = cleanText(update.segment ?? current.segment ?? '')

  if (!nextName) {
    throw new Error('Informe o nome da empresa.')
  }

  const duplicatedName = companies.some(
    (company, itemIndex) => itemIndex !== index && company.name.toLowerCase() === nextName.toLowerCase()
  )
  if (duplicatedName) {
    throw new Error('Já existe uma empresa com este nome.')
  }

  const duplicatedCnpj = nextCnpj
    ? companies.some(
        (company, itemIndex) =>
          itemIndex !== index && normalizeCnpj(cleanText(company.cnpj)) === nextCnpj
      )
    : false
  if (duplicatedCnpj) {
    throw new Error('Já existe uma empresa com este CNPJ.')
  }

  if (nextCnpj && nextCnpj.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos quando informado.')
  }

  const nextCompany: StoredCompany = {
    ...current,
    name: nextName,
    cnpj: nextCnpj || undefined,
    segment: nextSegment || undefined,
    status: update.status ?? current.status,
    updatedAt: new Date().toISOString(),
  }

  const next = [...companies]
  next[index] = nextCompany
  writeCompanies(next)
  ensureActiveCompany(next)
  dispatchActiveCompanyChanged()
  return nextCompany
}

export function setActiveCompany(companyId: string) {
  const normalizedId = cleanText(companyId)
  if (!normalizedId) {
    throw new Error('Empresa ativa inválida.')
  }

  const company = getCompanyById(normalizedId)
  if (!company || company.status !== 'active') {
    throw new Error('A empresa selecionada não está ativa.')
  }

  if (hasLocalStorage()) {
    window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, normalizedId)
  }

  dispatchActiveCompanyChanged()
}

export function getActiveCompanyChangedEventName() {
  return ACTIVE_COMPANY_CHANGED_EVENT
}
