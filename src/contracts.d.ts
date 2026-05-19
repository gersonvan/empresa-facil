import type { LaunchEntry } from './domain'

export interface IngestionRecord {
  record_type: 'launch_entry'
  company_id: string
  month: string
  cost_type: 'company' | 'personal'
  amount: number
  description: string
  source_id: string
}

export function toIngestionRecord(entry: LaunchEntry): IngestionRecord