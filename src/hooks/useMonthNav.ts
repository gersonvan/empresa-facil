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

export interface MonthNavOptions {
  /** Mês inicial no formato "YYYY-MM". Padrão: mês atual. */
  initialMonth?: string
  /** Mês mais antigo permitido "YYYY-MM". undefined = sem limite. */
  oldestAllowedMonth?: string
}

/**
 * Gerencia a navegação entre meses com suporte a limite de histórico por plano.
 */
export function useMonthNav(initialMonthOrOptions?: string | MonthNavOptions) {
  const opts: MonthNavOptions =
    typeof initialMonthOrOptions === 'string'
      ? { initialMonth: initialMonthOrOptions }
      : (initialMonthOrOptions ?? {})

  const { initialMonth, oldestAllowedMonth } = opts

  const [month, setMonth] = useState<string>(() => {
    const start = initialMonth ?? currentMonth()
    // Se o mês inicial estiver antes do limite, começa no limite
    if (oldestAllowedMonth && start < oldestAllowedMonth) return oldestAllowedMonth
    return start
  })

  const now = currentMonth()

  const isAtOldest = oldestAllowedMonth !== undefined && month <= oldestAllowedMonth

  function prevMonth() {
    setMonth((m) => {
      const candidate = shiftMonth(m, -1)
      if (oldestAllowedMonth && candidate < oldestAllowedMonth) return m
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
    next: () => setMonth((m) => shiftMonth(m, +1)),
    goTo: (m: string) => setMonth(m),
    reset: () => setMonth(currentMonth()),
  }
}
