import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAuthToken, isAuthenticated } from '../authStore'
import { API_URL } from '../config'

type State = 'loading' | 'allowed' | 'denied' | 'unauthenticated'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    if (!isAuthenticated()) {
      setState('unauthenticated')
      return
    }

    const token = getAuthToken()
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setState(data?.user?.isAdmin ? 'allowed' : 'denied')
      })
      .catch(() => setState('denied'))
  }, [])

  if (state === 'loading') {
    return null // breve loading invisível
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (state === 'denied') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
