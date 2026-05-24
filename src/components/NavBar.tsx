import { NavLink } from 'react-router-dom'
import styles from './NavBar.module.css'

const navItems = [
  { path: '/dashboard', label: 'Início' },
  { path: '/launch', label: 'Lançar' },
  { path: '/categories', label: 'Categorias' },
  { path: '/chart-of-accounts', label: 'Plano' },
  { path: '/records', label: 'Registros' },
  { path: '/dre', label: 'DRE' },
  { path: '/month-review', label: 'Mês' },
  { path: '/training', label: 'Treino' },
]

export default function NavBar() {
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
    </nav>
  )
}
