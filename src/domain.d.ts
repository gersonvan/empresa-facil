export const MONTH_STATUS_VALUES: readonly ['open', 'in_review', 'closed']
export const COST_TYPE_VALUES: readonly ['company', 'personal']
export const ACCOUNT_ORIGIN_VALUES: readonly ['company', 'personal', 'unknown']

export function normalizeMonth(month: string): string

export interface LaunchEntryInput {
  id: string
  companyId: string
  month: string
  costType: 'company' | 'personal'
  accountOrigin?: 'company' | 'personal' | 'unknown'
  description: string
  amount: number
  createdAt?: string
}

export interface LaunchEntry {
  id: string
  companyId: string
  month: string
  costType: 'company' | 'personal'
  accountOrigin: 'company' | 'personal' | 'unknown'
  description: string
  amount: number
  createdAt: string
}

export function createLaunchEntry(input: LaunchEntryInput): LaunchEntry
