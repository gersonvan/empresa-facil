import {
  buildMonthlyDreOverview,
  calculateVersionedSimplesSupport,
  createSimplesRuleCatalog,
  type MonthlyOverview,
} from '../calculations'
import { monthLifecycleStore } from '../monthLifecycle'
import { listLaunchEntries, listLaunchLines } from '../launchStore'

const DEFAULT_COMPANY_NAME = 'Empresa ativa'
const COMPANY_ID_STORAGE_KEY = 'empresa-facil:active-company-id'

function monthFromNow() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function inferMonthContext() {
  const month = monthFromNow()
  const monthEntries = listLaunchEntries({ month, costType: 'all' })
  if (monthEntries.length > 0) {
    return {
      companyId: monthEntries[0].companyId,
      companyName: DEFAULT_COMPANY_NAME,
      month,
    }
  }

  const latestEntries = listLaunchEntries({ costType: 'all' })
  if (latestEntries.length > 0) {
    const latestMonth = latestEntries[0].month
    return {
      companyId: latestEntries[0].companyId,
      companyName: DEFAULT_COMPANY_NAME,
      month: latestMonth,
    }
  }

  return {
    companyId: getOrCreateActiveCompanyId(),
    companyName: DEFAULT_COMPANY_NAME,
    month,
  }
}

function getOrCreateActiveCompanyId() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return `company-${Date.now()}`
  }

  const stored = window.localStorage.getItem(COMPANY_ID_STORAGE_KEY)
  if (stored && stored.trim()) {
    return stored
  }

  const next =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `company-${crypto.randomUUID()}`
      : `company-${Date.now()}`
  window.localStorage.setItem(COMPANY_ID_STORAGE_KEY, next)
  return next
}

function toRuleVersion(month: string) {
  return month.replace('-', '.')
}

function firstDayIso(month: string) {
  return `${month}-01T00:00:00.000Z`
}

function previousMonth(month: string) {
  const [yearRaw, monthRaw] = month.split('-')
  const year = Number(yearRaw)
  const monthNumber = Number(monthRaw)

  const baseDate = new Date(year, monthNumber - 1, 1)
  baseDate.setMonth(baseDate.getMonth() - 1)
  const previousYear = baseDate.getFullYear()
  const previousMonthNumber = String(baseDate.getMonth() + 1).padStart(2, '0')
  return `${previousYear}-${previousMonthNumber}`
}

function createFiscalRuleCatalog(month: string) {
  const previous = previousMonth(month)

  return createSimplesRuleCatalog({
    rules: [
      {
        version: toRuleVersion(previous),
        regime: 'simples_nacional',
        effectiveRate: 5.9,
        changeReason: 'Regra de referencia do mes anterior.',
        publishedAt: firstDayIso(previous),
        source: 'finance-team',
      },
      {
        version: toRuleVersion(month),
        regime: 'simples_nacional',
        effectiveRate: 6.1,
        changeReason: 'Regra fiscal vigente no mes atual.',
        publishedAt: firstDayIso(month),
        source: 'finance-team',
      },
    ],
  })
}

export function getMonthlyOverview(): MonthlyOverview {
  const monthContext = inferMonthContext()
  const fiscalRuleCatalog = createFiscalRuleCatalog(monthContext.month)
  const ruleVersion = toRuleVersion(monthContext.month)

  const lifecycle = monthLifecycleStore.getStatus({
    companyId: monthContext.companyId,
    month: monthContext.month,
  })

  const lifecycleSnapshot = {
    status: lifecycle.status,
    hasBeenClosed: lifecycle.hasBeenClosed,
    closedAt: lifecycle.closedAt,
    closedByRole: lifecycle.closedByRole,
    historyCount: Array.isArray(lifecycle.history) ? lifecycle.history.length : null,
  }

  const calculation = calculateVersionedSimplesSupport({
    companyId: monthContext.companyId,
    month: monthContext.month,
    lines: listLaunchLines({ companyId: monthContext.companyId, month: monthContext.month }),
    ruleCatalog: fiscalRuleCatalog,
    ruleVersion,
    monthLifecycle: lifecycleSnapshot,
  })

  return buildMonthlyDreOverview(calculation)
}

export function getMonthContext() {
  return inferMonthContext()
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