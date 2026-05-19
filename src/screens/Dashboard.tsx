import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'

const indicators = [
  { label: 'Receita', value: '—' },
  { label: 'Despesa', value: '—' },
  { label: 'Resultado', value: '—' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <ScreenContainer title="Dashboard">
      <div className={styles.actions}>
        <Button size="sm" variant="outline" onClick={() => navigate('/launch')}>
          Registrar lançamento
        </Button>
      </div>

      <Card className={styles.nextStepCard} padding="compact">
        <div className={styles.nextStepHeader}>
          <h2 className={styles.nextStepTitle}>Próximo passo do dia</h2>
          <p className={styles.nextStepText}>Registre primeiro o gasto mais recente para manter o mês em dia.</p>
        </div>
        <div className={styles.nextStepActions}>
          <Button size="sm" onClick={() => navigate('/launch?intent=company')}>Registrar empresa</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/launch?intent=personal')}>
            Registrar pessoal
          </Button>
        </div>
      </Card>

      <div className={styles.indicators}>
        {indicators.map(({ label, value }) => (
          <Card key={label} className={styles.indicator} padding="regular">
            <span className={styles.indicatorLabel}>{label}</span>
            <span className={styles.indicatorValue}>{value}</span>
          </Card>
        ))}
      </div>
    </ScreenContainer>
  )
}
