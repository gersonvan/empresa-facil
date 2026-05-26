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

function bootstrapCompanies() {
  if (!hasLocalStorage()) {
    const now = new Date().toISOString()
    return [
      {
        id: nextCompanyId(),
        name: 'Empresa principal',
        status: 'active' as const,
        createdAt: now,
        updatedAt: now,
      },
    ]
  }

  const now = new Date().toISOString()
  const legacyActiveId = cleanText(window.localStorage.getItem(LEGACY_ACTIVE_COMPANY_STORAGE_KEY))
  const activeId = cleanText(window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY))
  const seedId = activeId || legacyActiveId || nextCompanyId()

  const defaultCompany: StoredCompany = {
    id: seedId,
    name: 'Empresa principal',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }

  writeCompanies([defaultCompany])
  window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, seedId)
  return [defaultCompany]
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
