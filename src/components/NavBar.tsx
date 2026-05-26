import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styles from './NavBar.module.css'

const navItems = [
  { path: '/dashboard', label: 'Início' },
  { path: '/launch', label: 'Lançar' },
  { path: '/records', label: 'Registros' },
  { path: '/category-insights', label: 'Análise' },
  { path: '/deduction-review', label: 'Deduções' },
  { path: '/cash-flow-projection', label: 'Projeção' },
  { path: '/dre', label: 'DRE' },
  { path: '/month-review', label: 'Mês' },
]

const settingsItems = [
  { path: '/companies', label: 'Empresas' },
  { path: '/tax-profile', label: 'Tributação' },
  { path: '/categories', label: 'Categorias' },
  { path: '/chart-of-accounts', label: 'Plano' },
  { path: '/training', label: 'Treino' },
]

export default function NavBar() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()

  const isSettingsRouteActive = useMemo(
    () => settingsItems.some(({ path }) => location.pathname.startsWith(path)),
    [location.pathname]
  )

  const shouldShowSettings = settingsOpen || isSettingsRouteActive

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <div className={styles.brand}>
        <div className={styles.brandMark} aria-hidden="true">
          EF
        </div>
        <div className={styles.brandTextBlock}>
          <span className={styles.brandTitle}>EmpresaFácil</span>
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
