import { NavLink } from 'react-router-dom'
import styles from './NavBar.module.css'

const navItems = [
  { path: '/dashboard', label: 'Início' },
  { path: '/launch', label: 'Lançar' },
  { path: '/dre', label: 'DRE' },
  { path: '/month-review', label: 'Mês' },
]

export default function NavBar() {
  return (
    <nav className={styles.nav} aria-label="Navegação principal">
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
