import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styles from './NavBar.module.css'
import { useSyncStatus } from '../hooks/useSyncStatus'
import { isAuthenticated } from '../authStore'
import { EFSymbol, EFWordmark } from './EFLogo'

const SYNC_LABELS: Record<string, string> = {
  idle: 'Sincronizado',
  pending: 'Aguardando sync…',
  syncing: 'Sincronizando…',
  error: 'Falha no sync',
  offline: 'Sem conexão',
}

const navItems = [
  { path: '/dashboard', label: 'Início' },
  { path: '/launch', label: 'Lançar' },
  { path: '/records', label: 'Registros' },
  { path: '/category-insights', label: 'Análise' },
  { path: '/deduction-review', label: 'Impostos' },
  { path: '/cash-flow-projection', label: 'Previsão' },
  { path: '/dre', label: 'Resultado' },
  { path: '/month-review', label: 'Fechar Mês' },
]

const settingsItems = [
  { path: '/members', label: 'Equipe' },
  { path: '/companies', label: 'Empresas' },
  { path: '/tax-profile', label: 'Tributação' },
  { path: '/categories', label: 'Categorias' },
  { path: '/chart-of-accounts', label: 'Plano' },
  { path: '/training', label: 'Treino' },
]

export default function NavBar() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()
  const syncStatus = useSyncStatus()
  const showSync = isAuthenticated()

  const isSettingsRouteActive = useMemo(
    () => settingsItems.some(({ path }) => location.pathname.startsWith(path)),
    [location.pathname]
  )

  const shouldShowSettings = settingsOpen || isSettingsRouteActive

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <div className={styles.brand}>
        <EFSymbol size={36} onDark />
        <div className={styles.brandTextBlock}>
          <EFWordmark size={15} onDark />
          <span className={styles.brandSubtitle}>Controle financeiro simples</span>
        </div>
      </div>
      {navItems.map(({ path, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          {label}
        </NavLink>
      ))}

      <button
        type="button"
        className={`${styles.settingsToggle} ${isSettingsRouteActive ? styles.active : ''}`}
        onClick={() => setSettingsOpen((current) => !current)}
        aria-expanded={shouldShowSettings}
        aria-controls="settings-submenu"
      >
        Configurações
      </button>

      {showSync ? (
        <div
          className={`${styles.syncIndicator} ${styles[`sync_${syncStatus}`]}`}
          title={SYNC_LABELS[syncStatus]}
          aria-label={SYNC_LABELS[syncStatus]}
        >
          <span className={styles.syncDot} aria-hidden="true" />
          <span className={styles.syncLabel}>{SYNC_LABELS[syncStatus]}</span>
        </div>
      ) : null}

      {shouldShowSettings ? (
        <div id="settings-submenu" className={styles.settingsPanel}>
          {settingsItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `${styles.settingsItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setSettingsOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </nav>
  )
}
