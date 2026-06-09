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

/**
 * Gerencia a navegação entre meses.
 *
 * @param initialMonth  Mês inicial no formato "YYYY-MM".
 *                      Se omitido usa o mês atual do calendário.
 */
export function useMonthNav(initialMonth?: string) {
  const [month, setMonth] = useState<string>(() => initialMonth ?? currentMonth())

  const now = currentMonth()

  return {
    month,
    label: monthLabel(month),
    isAtLatest: month >= now,
    prev: () => setMonth((m) => shiftMonth(m, -1)),
    next: () => setMonth((m) => shiftMonth(m, +1)),
    goTo: (m: string) => setMonth(m),
    reset: () => setMonth(currentMonth()),
  }
}
