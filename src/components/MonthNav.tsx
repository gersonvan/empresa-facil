import styles from './MonthNav.module.css'

interface MonthNavProps {
  label: string
  onPrev: () => void
  onNext: () => void
  isAtLatest: boolean
  isAtOldest?: boolean
  /** Quando true mostra tooltip de upgrade no botão de voltar bloqueado */
  showUpgradeHint?: boolean
}

export default function MonthNav({
  label,
  onPrev,
  onNext,
  isAtLatest,
  isAtOldest = false,
  showUpgradeHint = false,
}: MonthNavProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.nav} aria-label="Navegação por mês">
        <button
          type="button"
          className={styles.arrow}
          onClick={onPrev}
          disabled={isAtOldest}
          aria-label="Mês anterior"
          title={isAtOldest && showUpgradeHint ? 'Limite do plano Free — faça upgrade para ver mais meses' : undefined}
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
      {isAtOldest && showUpgradeHint && (
        <p className={styles.limitHint}>
          Limite de histórico do plano Free (3 meses).{' '}
          <a href="/members" className={styles.limitLink}>Faça upgrade</a> para histórico ilimitado.
        </p>
      )}
    </div>
  )
}
