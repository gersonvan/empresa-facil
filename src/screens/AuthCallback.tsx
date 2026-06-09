import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setAuthToken } from '../authStore'
import { API_URL } from '../config'
import styles from './AuthCallback.module.css'

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: 'Falha na autenticação com o provedor. Tente novamente.',
  token_missing: 'Link de acesso inválido.',
  token_invalido: 'Link expirado ou já utilizado. Solicite um novo.',
  token_ausente: 'Link de acesso inválido.',
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const errorCode = searchParams.get('error')

    if (token) {
      setAuthToken(token)

      // Verifica se o usuário precisa de onboarding antes de redirecionar
      async function checkOnboarding() {
        try {
          const res = await fetch(`${API_URL}/api/onboarding/status`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const { needsOnboarding } = await res.json() as { needsOnboarding: boolean }
            window.location.replace(needsOnboarding ? '/onboarding' : '/dashboard')
            return
          }
        } catch {
          // Backend indisponível — redireciona direto para o dashboard
        }
        window.location.replace('/dashboard')
      }

      checkOnboarding()
      return
    }

    if (errorCode) {
      setError(ERROR_MESSAGES[errorCode] ?? 'Erro desconhecido. Tente novamente.')
      return
    }

    // No token and no error — shouldn't happen, redirect to login
    navigate('/login', { replace: true })
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>✕</div>
          <h1 className={styles.title}>Falha ao entrar</h1>
          <p className={styles.desc}>{error}</p>
          <a href="/login" className={styles.backLink}>Voltar para o login</a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.loadingText}>Autenticando…</p>
      </div>
    </div>
  )
}
