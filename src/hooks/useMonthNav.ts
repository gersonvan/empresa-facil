import { useState } from 'react'

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${MONTHS_PT[Number(m) - 1]} ${year}`
}

const SYNC_KEY = 'empresa-facil:active-month'

function getSyncedMonth() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(SYNC_KEY)
  } catch {
    return null
  }
}

function saveSyncedMonth(month: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SYNC_KEY, month)
    }
  } catch {
    // A navegação continua funcionando mesmo quando o armazenamento não está disponível.
  }
}

export interface MonthNavOptions {
  /** Mês inicial no formato "YYYY-MM". Padrão: mês atual. */
  initialMonth?: string
  /** Mês mais antigo permitido "YYYY-MM". undefined = sem limite. */
  oldestAllowedMonth?: string
  /** Sincroniza o mês selecionado com localStorage para persistir entre telas. */
  sync?: boolean
}

/**
 * Gerencia a navegação entre meses com suporte a limite de histórico por plano.
 */
export function useMonthNav(initialMonthOrOptions?: string | MonthNavOptions) {
  const opts: MonthNavOptions =
    typeof initialMonthOrOptions === 'string'
      ? { initialMonth: initialMonthOrOptions }
      : (initialMonthOrOptions ?? {})

  const { initialMonth, oldestAllowedMonth, sync } = opts

  const [month, setMonth] = useState<string>(() => {
    const synced = sync ? getSyncedMonth() : null
    const start = synced ?? initialMonth ?? currentMonth()
    if (oldestAllowedMonth && start < oldestAllowedMonth) return oldestAllowedMonth
    return start
  })

  const now = currentMonth()

  const isAtOldest = oldestAllowedMonth !== undefined && month <= oldestAllowedMonth

  function updateMonth(next: string) {
    if (sync) saveSyncedMonth(next)
    setMonth(next)
  }

  function prevMonth() {
    setMonth((m) => {
      const candidate = shiftMonth(m, -1)
      if (oldestAllowedMonth && candidate < oldestAllowedMonth) return m
      if (sync) saveSyncedMonth(candidate)
      return candidate
    })
  }

  return {
    month,
    label: monthLabel(month),
    isAtLatest: month >= now,
    isAtOldest,
    oldestAllowedMonth,
    prev: prevMonth,
    next: () => updateMonth(shiftMonth(month, +1)),
    goTo: (m: string) => updateMonth(m),
    reset: () => updateMonth(currentMonth()),
  }
}
