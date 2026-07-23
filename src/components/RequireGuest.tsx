import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../authStore'

interface RequireGuestProps {
  children: ReactNode
}

export default function RequireGuest({ children }: RequireGuestProps) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
