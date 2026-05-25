export type CommitmentType = 'fixed' | 'installment'
export type CommitmentCostType = 'company' | 'personal'

import { monthLifecycleStore } from './monthLifecycle'

const STORAGE_KEY = 'empresa-facil:commitments:v1'
const HISTORY_STORAGE_KEY = 'empresa-facil:commitments-history:v1'

export type CommitmentAuditAction = 'created' | 'updated' | 'removed' | 'installment_advanced'

export interface CommitmentAuditEntry {
  id: string
  commitmentId: string
  companyId: string
  action: CommitmentAuditAction
  summary: string
  at: string
}

export interface StoredCommitment {
  id: string
  companyId: string
  description: string
  amount: number
  type: CommitmentType
  costType: CommitmentCostType
  startMonth: string
  endMonth: string | null
  totalInstallments: number | null
  currentInstallment: number | null
  categoryId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface ListCommitmentsFilters {
  companyId?: string
  costType?: CommitmentCostType | 'all'
  type?: CommitmentType | 'all'
}

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function monthFromNow() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function normalizeMonth(input: unknown) {
  const value = String(input ?? '').trim()
  return /^\d{4}-\d{2}$/.test(value) ? value : monthFromNow()
}

function toFiniteAmount(input: unknown) {
  const value = Number(input)
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.round(value * 100) / 100
}

function toPositiveInteger(input: unknown, fallback: number | null = null) {
  if (input === null || input === undefined || input === '') {
    return fallback
  }

  const value = Number(input)
  if (!Number.isInteger(value) || value <= 0) {
    return fallback
  }

  return value
}

function normalizeInstallmentFields(
  type: CommitmentType,
  totalInstallmentsInput: unknown,
  currentInstallmentInput: unknown
) {
  if (type !== 'installment') {
    return {
      totalInstallments: null,
      currentInstallment: null,
    }
  }

  const totalInstallments = toPositiveInteger(totalInstallmentsInput, 1) as number
  const rawCurrentInstallment = toPositiveInteger(currentInstallmentInput, 1) as number
  const currentInstallment = Math.min(rawCurrentInstallment, totalInstallments + 1)

  return {
    totalInstallments,
    currentInstallment,
  }
}

function assertMonthOpen({ companyId, month }: { companyId: string; month: string }) {
  if (monthLifecycleStore.isMonthClosed({ companyId, month })) {
    throw new Error(`Periodo ${month} esta fechado. Reabra o mes para alterar compromissos.`)
  }
}

function normalizeCommitment(input: unknown): StoredCommitment | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const value = input as Partial<StoredCommitment>
  if (!value.id || !value.companyId || !value.description) {
    return null
  }

  const type: CommitmentType = value.type === 'installment' ? 'installment' : 'fixed'
  const nowIso = new Date().toISOString()
  const installmentFields = normalizeInstallmentFields(
    type,
    value.totalInstallments,
    value.currentInstallment
  )

  return {
    id: String(value.id),
    companyId: String(value.companyId),
    description: String(value.description),
    amount: toFiniteAmount(value.amount),
    type,
    costType: value.costType === 'personal' ? 'personal' : 'company',
    startMonth: normalizeMonth(value.startMonth),
    endMonth: value.endMonth ? normalizeMonth(value.endMonth) : null,
    totalInstallments: installmentFields.totalInstallments,
    currentInstallment: installmentFields.currentInstallment,
    categoryId: value.categoryId ? String(value.categoryId) : null,
    notes: value.notes ? String(value.notes) : null,
    createdAt: value.createdAt ? String(value.createdAt) : nowIso,
    updatedAt: value.updatedAt ? String(value.updatedAt) : nowIso,
  }
}

function readCommitments() {
  if (!hasLocalStorage()) {
    return [] as StoredCommitment[]
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return [] as StoredCommitment[]
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return [] as StoredCommitment[]
    }

    return parsed
      .map((item) => normalizeCommitment(item))
      .filter(Boolean) as StoredCommitment[]
  } catch {
    return [] as StoredCommitment[]
  }
}

function writeCommitments(commitments: StoredCommitment[]) {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(commitments))
}

function readHistory() {
  if (!hasLocalStorage()) {
    return [] as CommitmentAuditEntry[]
  }

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
  if (!raw) {
    return [] as CommitmentAuditEntry[]
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return [] as CommitmentAuditEntry[]
    }

    return parsed
      .filter((entry): entry is CommitmentAuditEntry => Boolean(entry && typeof entry === 'object'))
      .map((entry) => ({
        id: String(entry.id ?? ''),
        commitmentId: String(entry.commitmentId ?? ''),
        companyId: String(entry.companyId ?? ''),
        action:
          entry.action === 'created' ||
          entry.action === 'updated' ||
          entry.action === 'removed' ||
          entry.action === 'installment_advanced'
            ? entry.action
            : 'updated',
        summary: String(entry.summary ?? ''),
        at: String(entry.at ?? ''),
      }))
      .filter((entry) => entry.id && entry.commitmentId && entry.companyId && entry.at)
  } catch {
    return [] as CommitmentAuditEntry[]
  }
}

function writeHistory(entries: CommitmentAuditEntry[]) {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
}

function nextAuditId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `audit-${Date.now()}`
}

function formatCommitmentSummary(commitment: StoredCommitment) {
  const formattedAmount = commitment.amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const typeLabel = commitment.type === 'fixed' ? 'conta fixa' : 'parcelamento'
  return `${commitment.description} (${typeLabel}, R$ ${formattedAmount})`
}

function appendHistory(entry: CommitmentAuditEntry) {
  const current = readHistory()
  writeHistory([...current, entry])
}

function registerAudit({
  action,
  commitment,
  summary,
}: {
  action: CommitmentAuditAction
  commitment: StoredCommitment
  summary: string
}) {
  appendHistory({
    id: nextAuditId(),
    commitmentId: commitment.id,
    companyId: commitment.companyId,
    action,
    summary,
    at: new Date().toISOString(),
  })
}

export function saveCommitment(commitment: StoredCommitment) {
  const normalized = normalizeCommitment(commitment)
  if (!normalized) {
    throw new Error('Compromisso invalido.')
  }

  assertMonthOpen({ companyId: normalized.companyId, month: normalized.startMonth })

  const current = readCommitments()
  writeCommitments([...current, normalized])
  registerAudit({
    action: 'created',
    commitment: normalized,
    summary: `Criado: ${formatCommitmentSummary(normalized)}.`,
  })
  return normalized
}

export function getCommitmentById(commitmentId: string) {
  return readCommitments().find((commitment) => commitment.id === commitmentId) ?? null
}

export function updateCommitment(
  commitmentId: string,
  update: Partial<StoredCommitment>,
  options?: { auditAction?: CommitmentAuditAction }
) {
  const current = readCommitments()
  const index = current.findIndex((item) => item.id === commitmentId)

  if (index === -1) {
    throw new Error('Compromisso nao encontrado.')
  }

  assertMonthOpen({ companyId: current[index].companyId, month: current[index].startMonth })

  const next = normalizeCommitment({
    ...current[index],
    ...update,
    id: current[index].id,
    companyId: current[index].companyId,
    createdAt: current[index].createdAt,
    updatedAt: new Date().toISOString(),
  })

  if (!next) {
    throw new Error('Falha ao atualizar compromisso.')
  }

  const nextItems = [...current]
  nextItems[index] = next
  writeCommitments(nextItems)
  registerAudit({
    action: options?.auditAction ?? 'updated',
    commitment: next,
    summary:
      options?.auditAction === 'installment_advanced'
        ? `Parcela avancada: ${next.description} (${next.currentInstallment}/${next.totalInstallments}).`
        : `Atualizado: ${formatCommitmentSummary(next)}.`,
  })
  return next
}

export function removeCommitment(commitmentId: string) {
  const current = readCommitments()
  const item = current.find((entry) => entry.id === commitmentId)
  if (!item) {
    return
  }

  assertMonthOpen({ companyId: item.companyId, month: item.startMonth })

  writeCommitments(current.filter((item) => item.id !== commitmentId))
  registerAudit({
    action: 'removed',
    commitment: item,
    summary: `Removido: ${formatCommitmentSummary(item)}.`,
  })
}

export function advanceInstallment(commitmentId: string) {
  const current = readCommitments()
  const index = current.findIndex((item) => item.id === commitmentId)
  if (index === -1) {
    throw new Error('Compromisso nao encontrado.')
  }

  const target = current[index]
  if (target.type !== 'installment') {
    throw new Error('Somente parcelamentos podem avancar parcela.')
  }

  assertMonthOpen({ companyId: target.companyId, month: target.startMonth })

  const totalInstallments = Number(target.totalInstallments ?? 0)
  const currentInstallment = Number(target.currentInstallment ?? 1)
  const nextInstallment = Math.min(currentInstallment + 1, totalInstallments + 1)

  return updateCommitment(
    commitmentId,
    {
    currentInstallment: nextInstallment,
    updatedAt: new Date().toISOString(),
    },
    { auditAction: 'installment_advanced' }
  )
}

export function listCommitmentHistory(filters: {
  companyId?: string
  commitmentId?: string
  action?: CommitmentAuditAction | 'all'
  limit?: number
} = {}) {
  const { companyId, commitmentId, action = 'all', limit } = filters
  const base = readHistory()
    .filter((entry) => {
      if (companyId && entry.companyId !== companyId) {
        return false
      }

      if (commitmentId && entry.commitmentId !== commitmentId) {
        return false
      }

      if (action !== 'all' && entry.action !== action) {
        return false
      }

      return true
    })
    .sort((left, right) => right.at.localeCompare(left.at))

  if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
    return base.slice(0, Math.floor(limit))
  }

  return base
}

export function listCommitments(filters: ListCommitmentsFilters = {}) {
  const { companyId, costType = 'all', type = 'all' } = filters

  return readCommitments()
    .filter((item) => {
      if (companyId && item.companyId !== companyId) {
        return false
      }

      if (costType !== 'all' && item.costType !== costType) {
        return false
      }

      if (type !== 'all' && item.type !== type) {
        return false
      }

      return true
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
