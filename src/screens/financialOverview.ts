import {
  buildMonthlyDreOverview,
  calculateDreAndTaxSupport,
  createDreLineInput,
  createFiscalRuleSet,
  type MonthlyOverview,
} from '../calculations'

const COMPANY_ID = 'company-main'
const COMPANY_NAME = 'Empresa Principal'
const MONTH = '2026-05'

const monthlyLines = [
  createDreLineInput({
    entryId: 'line-001',
    companyId: COMPANY_ID,
    month: MONTH,
    amount: 12500,
    dreGroup: 'revenue',
    description: 'Vendas do periodo',
  }),
  createDreLineInput({
    entryId: 'line-002',
    companyId: COMPANY_ID,
    month: MONTH,
    amount: 900,
    dreGroup: 'deductions',
    description: 'Tributos sobre vendas',
  }),
  createDreLineInput({
    entryId: 'line-003',
    companyId: COMPANY_ID,
    month: MONTH,
    amount: 4800,
    dreGroup: 'expenses',
    description: 'Custos operacionais',
  }),
  createDreLineInput({
    entryId: 'line-004',
    companyId: COMPANY_ID,
    month: MONTH,
    amount: 180,
    dreGroup: 'financial_income',
    description: 'Rendimento financeiro',
  }),
]

const fiscalRule = createFiscalRuleSet({
  version: '2026.05',
  regime: 'simples_nacional',
  effectiveRate: 6.1,
})

const calculation = calculateDreAndTaxSupport({
  companyId: COMPANY_ID,
  month: MONTH,
  lines: monthlyLines,
  fiscalRule,
})

const monthlyOverview = buildMonthlyDreOverview(calculation)

export function getMonthlyOverview(): MonthlyOverview {
  return monthlyOverview
}

export function getMonthContext() {
  return {
    companyId: COMPANY_ID,
    companyName: COMPANY_NAME,
    month: MONTH,
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercent(value: number | null) {
  if (value === null) {
    return '—'
  }

  return `${value.toFixed(1).replace('.', ',')}%`
}