import { useState, useEffect } from 'react'
import { getActiveCompany } from '../companyStore'
import { getAuthToken } from '../authStore'
import { API_URL } from '../config'
import { currentMonth } from './useMonthNav'

export interface SubscriptionInfo {
  plan: 'free' | 'pro' | 'business'
  status: string
  memberCount: number
  maxMembers: number | null
  historyMonths: number | null
}

// Cache em memória para evitar fetch em toda troca de tela
let cache: { companyId: string; data: SubscriptionInfo; ts: number } | null = null
const CACHE_TTL_MS = 60_000 // 1 minuto

function authHeader(): Record<string, string> {
  const t = getAuthToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/**
 * Calcula o mês mais antigo que o plano permite navegar.
 * null = sem limite (pro/business).
 */
export function oldestAllowedMonth(historyMonths: number | null): string | undefined {
  if (historyMonths === null) return undefined
  const [y, m] = currentMonth().split('-').map(Number)
  const d = new Date(y, m - historyMonths, 1) // m-1 (0-based) + 1 - (historyMonths-1) = m - historyMonths
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function useSubscription() {
  const company = getActiveCompany()
  const companyId = company?.id ?? null

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(() => {
    if (cache && cache.companyId === companyId && Date.now() - cache.ts < CACHE_TTL_MS) {
      return cache.data
    }
    return null
  })

  useEffect(() => {
    if (!companyId) return
    if (cache && cache.companyId === companyId && Date.now() - cache.ts < CACHE_TTL_MS) {
      setSubscription(cache.data)
      return
    }

    fetch(`${API_URL}/api/companies/${companyId}/subscription`, { headers: authHeader() })
      .then((r) => r.ok ? r.json() : null)
      .then((data: SubscriptionInfo | null) => {
        if (data) {
          cache = { companyId, data, ts: Date.now() }
          setSubscription(data)
        }
      })
      .catch(() => {/* silencioso — UI degrada graciosamente */})
  }, [companyId])

  return subscription
}

/** Invalida o cache (chamar após upgrade bem-sucedido). */
export function invalidateSubscriptionCache() {
  cache = null
}
