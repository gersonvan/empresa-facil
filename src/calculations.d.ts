export interface FiscalRuleSet {
  version: string
  regime: string
  effectiveRate: number | null
  accountantValidationWarning: string
  changeReason: string
  publishedAt: string | null
  source: string
}

export interface MonthLifecycleSnapshot {
  status: string
  hasBeenClosed: boolean
  closedAt: string | null
  closedByRole: string | null
  historyCount: number | null
}

export interface DreLineInput {
  entryId: string
  companyId: string
  month: string
  amount: number
  dreGroup: 'revenue' | 'deductions' | 'expenses' | 'financial_income'
  description?: string
}

export interface CalculationOutput {
  companyId: string
  month: string
  fiscalRuleVersion: string
  dre: {
    groups: {
      revenue: number
      deductions: number
      expenses: number
      financialIncome: number
    }
    operatingResult: number
    lines: DreLineInput[]
  }
  taxSupport: {
    regime: string
    calculationBase: number
    effectiveRate: number | null
    estimatedTax: number | null
    ruleVersion: string
    accountantValidationWarning: string
    audit: {
      ruleVersion: string
      ruleFingerprint: string
      derivationFingerprint: string
      ruleChangeReason: string
      ruleSource: string
      rulePublishedAt: string | null
      lifecycleSnapshot: MonthLifecycleSnapshot | null
      supportOnly: true
    }
  }
}

export interface SimplesRuleCatalog {
  byVersion: Map<string, FiscalRuleSet>
  versions: string[]
}

export interface MonthlyOverview {
  summary: {
    companyId: string
    month: string
    fiscalRuleVersion: string
    revenue: number
    deductions: number
    expenses: number
    financialIncome: number
    operatingResult: number
    accountantValidationWarning: string
    taxRuleVersion: string
    taxDerivationFingerprint: string
  }
  indicators: {
    companyId: string
    month: string
    netMarginPercent: number | null
    taxBurdenPercent: number | null
    totalCosts: number
    operatingResult: number
  }
  costGroups: Array<{
    key: 'deductions' | 'expenses'
    label: string
    amount: number
    shareOfRevenuePercent: number | null
  }>
  taxSupport: CalculationOutput['taxSupport']
  views: {
    dashboard: {
      summary: MonthlyOverview['summary']
      indicators: MonthlyOverview['indicators']
      taxSupport: CalculationOutput['taxSupport']
    }
    dreReport: {
      summary: MonthlyOverview['summary']
      costGroups: MonthlyOverview['costGroups']
      taxSupport: CalculationOutput['taxSupport']
    }
  }
}

export function createFiscalRuleSet(input: {
  version: string
  regime?: string
  effectiveRate?: number | null
  accountantValidationWarning?: string
  changeReason?: string
  publishedAt?: string | null
  source?: string
}): FiscalRuleSet

export function createSimplesRuleCatalog(input: {
  rules: Array<{
    version: string
    regime?: string
    effectiveRate?: number | null
    accountantValidationWarning?: string
    changeReason?: string
    publishedAt?: string | null
    source?: string
  }>
}): SimplesRuleCatalog

export function getFiscalRuleFromCatalog(input: {
  ruleCatalog: SimplesRuleCatalog
  ruleVersion: string
}): FiscalRuleSet

export function createDreLineInput(input: DreLineInput): DreLineInput

export function calculateDreAndTaxSupport(input: {
  companyId: string
  month: string
  lines: DreLineInput[]
  fiscalRule: FiscalRuleSet
  monthLifecycle?: MonthLifecycleSnapshot | null
}): CalculationOutput

export function calculateVersionedSimplesSupport(input: {
  companyId: string
  month: string
  lines: DreLineInput[]
  ruleCatalog: SimplesRuleCatalog
  ruleVersion: string
  monthLifecycle?: MonthLifecycleSnapshot | null
}): CalculationOutput

export function buildMonthlyDreOverview(output: CalculationOutput): MonthlyOverview