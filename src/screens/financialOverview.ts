import {
  buildMonthlyDreOverview,
  calculateVersionedSimplesSupport,
  createSimplesRuleCatalog,
  createDreLineInput,
  type MonthlyOverview,
} from '../calculations'
import { monthLifecycleStore } from '../monthLifecycle'

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

const fiscalRuleCatalog = createSimplesRuleCatalog({
  rules: [
    {
      version: '2026.04',
      regime: 'simples_nacional',
      effectiveRate: 5.9,
      changeReason: 'Tabela vigente ate abril/2026.',
      publishedAt: '2026-04-01T00:00:00.000Z',
      source: 'finance-team',
    },
    {
      version: '2026.05',
      regime: 'simples_nacional',
      effectiveRate: 6.1,
      changeReason: 'Ajuste de aliquota efetiva para maio/2026.',
      publishedAt: '2026-05-01T00:00:00.000Z',
      source: 'finance-team',
    },
  ],
})

export function getMonthlyOverview(): MonthlyOverview {
  const lifecycle = monthLifecycleStore.getStatus({
    companyId: COMPANY_ID,
    month: MONTH,
  })

  const lifecycleSnapshot = {
    status: lifecycle.status,
    hasBeenClosed: lifecycle.hasBeenClosed,
    closedAt: lifecycle.closedAt,
    closedByRole: lifecycle.closedByRole,
    historyCount: Array.isArray(lifecycle.history) ? lifecycle.history.length : null,
  }

  const calculation = calculateVersionedSimplesSupport({
    companyId: COMPANY_ID,
    month: MONTH,
    lines: monthlyLines,
    ruleCatalog: fiscalRuleCatalog,
    ruleVersion: '2026.05',
    monthLifecycle: lifecycleSnapshot,
  })

  return buildMonthlyDreOverview(calculation)
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