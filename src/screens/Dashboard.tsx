import ScreenContainer from '../components/ScreenContainer'
import styles from './Dashboard.module.css'

const indicators = [
  { label: 'Receita', value: '—' },
  { label: 'Despesa', value: '—' },
  { label: 'Resultado', value: '—' },
]

export default function Dashboard() {
  return (
    <ScreenContainer title="Dashboard">
      <div className={styles.indicators}>
        {indicators.map(({ label, value }) => (
          <div key={label} className={styles.indicator}>
            <span className={styles.indicatorLabel}>{label}</span>
            <span className={styles.indicatorValue}>{value}</span>
          </div>
        ))}
      </div>
    </ScreenContainer>
  )
}
