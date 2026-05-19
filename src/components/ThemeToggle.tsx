import styles from './ThemeToggle.module.css'
import { useTheme } from '../theme'
import { Button } from './ui'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      variant="secondary"
      size="sm"
      className={styles.button}
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      <span className={styles.icon} aria-hidden="true">
        {isDark ? '☀' : '☾'}
      </span>
      <span className={styles.label}>{isDark ? 'Claro' : 'Escuro'}</span>
    </Button>
  )
}