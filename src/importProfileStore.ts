export type ImportFormat = 'ofx' | 'csv'

export interface ImportProfile {
  id: string
  companyId: string
  name: string
  accountName: string
  format: ImportFormat
  delimiter: ',' | ';' | '\t'
  skipLines: number
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY'
  dateColumn: number
  descriptionColumn: number
  amountColumn: number
  invertAmount: boolean
  builtIn?: boolean
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'empresa-facil:import-profiles:v1'

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readProfiles(): ImportProfile[] {
  if (!hasLocalStorage()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed as ImportProfile[] : []
  } catch {
    return []
  }
}

function writeProfiles(profiles: ImportProfile[]) {
  if (hasLocalStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `import-profile-${Date.now()}`
}

function defaultProfile(companyId: string, id = 'builtin-ofx', name = 'Extrato OFX', accountName = 'Conta bancária'): ImportProfile {
  const now = new Date().toISOString()
  return {
    id, companyId, name, accountName, format: 'ofx',
    delimiter: ',', skipLines: 0, dateFormat: 'DD/MM/YYYY', dateColumn: 0, descriptionColumn: 1,
    amountColumn: 2, invertAmount: false, builtIn: true, createdAt: now, updatedAt: now,
  }
}

function builtInProfiles(companyId: string) {
  return [
    defaultProfile(companyId),
    defaultProfile(companyId, 'builtin-itau-ofx', 'Itaú — Conta corrente', 'Itaú Corrente'),
    defaultProfile(companyId, 'builtin-bradesco-ofx', 'Bradesco — Conta corrente', 'Bradesco Corrente'),
    defaultProfile(companyId, 'builtin-santander-ofx', 'Santander — Conta corrente', 'Santander Corrente'),
    defaultProfile(companyId, 'builtin-bb-ofx', 'Banco do Brasil — Conta corrente', 'BB Corrente'),
    defaultProfile(companyId, 'builtin-caixa-ofx', 'Caixa — Conta corrente', 'Caixa Corrente'),
    defaultProfile(companyId, 'builtin-nubank-ofx', 'Nubank — Conta', 'Nubank Conta'),
    defaultProfile(companyId, 'builtin-inter-ofx', 'Inter — Conta corrente', 'Inter Corrente'),
    defaultProfile(companyId, 'builtin-sicoob-ofx', 'Sicoob — Conta corrente', 'Sicoob Corrente'),
    defaultProfile(companyId, 'builtin-sicredi-ofx', 'Sicredi — Conta corrente', 'Sicredi Corrente'),
  ]
}

export function listImportProfiles(companyId: string) {
  const profiles = readProfiles().filter((profile) => profile.companyId === companyId)
  return [...builtInProfiles(companyId), ...profiles]
}

export function saveImportProfile(input: Omit<ImportProfile, 'id' | 'createdAt' | 'updatedAt' | 'builtIn'>) {
  const profiles = readProfiles()
  const now = new Date().toISOString()
  const profile: ImportProfile = { ...input, id: newId(), createdAt: now, updatedAt: now }
  writeProfiles([...profiles, profile])
  return profile
}

export function deleteImportProfile(profileId: string) {
  writeProfiles(readProfiles().filter((profile) => profile.id !== profileId || profile.builtIn))
}
