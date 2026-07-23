import type { DreGroup } from './categoryStore'

export interface TransactionMemory {
  id: string
  companyId: string
  normalizedDescription: string
  costType: 'company' | 'personal'
  type: 'Entrada' | 'Saída'
  categoryId: string
  categoryName: string
  dreGroup: DreGroup
  updatedAt: string
}

const STORAGE_KEY = 'empresa-facil:transaction-memory:v1'

export function normalizeTransactionDescription(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readMemory(): TransactionMemory[] {
  if (!hasLocalStorage()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed as TransactionMemory[] : []
  } catch {
    return []
  }
}

function writeMemory(memory: TransactionMemory[]) {
  if (hasLocalStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
}

export function listTransactionMemory(companyId: string) {
  return readMemory()
    .filter((item) => item.companyId === companyId)
    .sort((left, right) => left.normalizedDescription.localeCompare(right.normalizedDescription, 'pt-BR'))
}

export function removeTransactionMemory(memoryId: string) {
  writeMemory(readMemory().filter((item) => item.id !== memoryId))
}

export function findTransactionMemory(companyId: string, description: string, costType: 'company' | 'personal', type: 'Entrada' | 'Saída') {
  const normalizedDescription = normalizeTransactionDescription(description)
  return readMemory().find((item) => item.companyId === companyId && item.normalizedDescription === normalizedDescription && item.costType === costType && item.type === type) ?? null
}

export function rememberTransactionCategory(input: Omit<TransactionMemory, 'id' | 'normalizedDescription' | 'updatedAt'> & { description: string }) {
  const normalizedDescription = normalizeTransactionDescription(input.description)
  if (!normalizedDescription) return null
  const current = readMemory()
  const now = new Date().toISOString()
  const next: TransactionMemory = {
    id: `memory-${input.companyId}-${input.costType}-${input.type}-${normalizedDescription}`,
    companyId: input.companyId,
    normalizedDescription,
    costType: input.costType,
    type: input.type,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    dreGroup: input.dreGroup,
    updatedAt: now,
  }
  const index = current.findIndex((item) => item.id === next.id)
  if (index === -1) writeMemory([...current, next])
  else {
    const updated = [...current]
    updated[index] = next
    writeMemory(updated)
  }
  return next
}
