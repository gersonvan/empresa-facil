export interface ProjectionCommitment {
  id: string
  companyId: string
  description: string
  amount: number
  type: 'fixed' | 'installment'
  costType: 'company' | 'personal'
  startMonth: string
  endMonth?: string | null
  totalInstallments?: number | null
  currentInstallment?: number | null
}

export interface ProjectionRow {
  month: string
  fixed: number
  installment: number
  total: number
}

export interface ProjectionSummary {
  nextMonth: number
  nextThreeMonths: number
  nextTwelveMonths: number
  horizonTotal: number
  peakMonth: { month: string; total: number } | null
}

export function createProjectionHorizon(input: {
  referenceMonth: string
  horizonMonths?: number
}): string[]

export function projectCommitments(input: {
  referenceMonth: string
  horizonMonths?: number
  commitments: ProjectionCommitment[]
  companyId?: string
  costType?: 'company' | 'personal' | 'all'
}): {
  referenceMonth: string
  horizonMonths: number
  rows: ProjectionRow[]
  summary: ProjectionSummary
}
