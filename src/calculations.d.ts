export interface FiscalRuleSet {
  version: string
  regime: string
  effectiveRate: number | null
  accountantValidationWarning: string
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
    accountantValidationWarning: string
  }
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
  views: {
    dashboard: {
      summary: MonthlyOverview['summary']
      indicators: MonthlyOverview['indicators']
    }
    dreReport: {
      summary: MonthlyOverview['summary']
      costGroups: MonthlyOverview['costGroups']
    }
  }
}

export function createFiscalRuleSet(input: {
  version: string
  regime?: string
  effectiveRate?: number | null
  accountantValidationWarning?: string
}): FiscalRuleSet

export function createDreLineInput(input: DreLineInput): DreLineInput

export function calculateDreAndTaxSupport(input: {
  companyId: string
  month: string
  lines: DreLineInput[]
  fiscalRule: FiscalRuleSet
}): CalculationOutput

export function buildMonthlyDreOverview(output: CalculationOutput): MonthlyOverview