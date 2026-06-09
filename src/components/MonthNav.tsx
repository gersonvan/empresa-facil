import styles from './MonthNav.module.css'

interface MonthNavProps {
  label: string
  onPrev: () => void
  onNext: () => void
  isAtLatest: boolean
}

export default function MonthNav({ label, onPrev, onNext, isAtLatest }: MonthNavProps) {
  return (
    <div className={styles.nav} aria-label="Navegação por mês">
      <button
        type="button"
        className={styles.arrow}
        onClick={onPrev}
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span className={styles.label}>{label}</span>
      <button
        type="button"
        className={styles.arrow}
        onClick={onNext}
        disabled={isAtLatest}
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  )
}
