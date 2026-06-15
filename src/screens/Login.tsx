import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import styles from './Login.module.css'
import { EFSymbol, EFWordmark } from '../components/EFLogo'

type MagicLinkState = 'idle' | 'loading' | 'sent' | 'error'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect width="8.5" height="8.5" fill="#F25022"/>
      <rect x="9.5" width="8.5" height="8.5" fill="#7FBA00"/>
      <rect y="9.5" width="8.5" height="8.5" fill="#00A4EF"/>
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/>
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [magicState, setMagicState] = useState<MagicLinkState>('idle')

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setMagicState('loading')
    try {
      const res = await fetch(`${API_URL}/auth/magic-link/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setMagicState(res.ok ? 'sent' : 'error')
    } catch {
      setMagicState('error')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <EFSymbol size={56} />
          <div>
            <EFWordmark size={22} />
            <div className={styles.brandSub}>Controle financeiro simples</div>
          </div>
        </div>

        <h1 className={styles.heading}>Bem-vindo de volta</h1>
        <p className={styles.sub}>Escolha como deseja entrar</p>

        <div className={styles.oauthButtons}>
          <a href={`${API_URL}/auth/google`} className={styles.oauthBtn}>
            <GoogleIcon />
            <span>Entrar com Google</span>
          </a>
          <a href={`${API_URL}/auth/microsoft`} className={styles.oauthBtn}>
            <MicrosoftIcon />
            <span>Entrar com Microsoft</span>
          </a>
        </div>

        <div className={styles.divider}>
          <span>ou continue por email</span>
        </div>

        {magicState === 'sent' ? (
          <div className={styles.sentBox}>
            <div className={styles.sentIcon}>✉</div>
            <p className={styles.sentTitle}>Link enviado!</p>
            <p className={styles.sentDesc}>
              Verifique sua caixa de entrada em <strong>{email}</strong>.<br />
              O link expira em 15 minutos.
            </p>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => { setMagicState('idle'); setEmail('') }}
            >
              Usar outro email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className={styles.form}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={magicState === 'loading'}
            />
            {magicState === 'error' ? (
              <p className={styles.errorMsg}>Falha ao enviar. Tente novamente.</p>
            ) : null}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={magicState === 'loading' || !email.trim()}
            >
              {magicState === 'loading' ? 'Enviando…' : 'Enviar link de acesso'}
            </button>
          </form>
        )}
        <p className={styles.legalLinks}>
          Ao entrar, você concorda com os{' '}
          <Link to="/termos">Termos de Uso</Link> e a{' '}
          <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  )
}
