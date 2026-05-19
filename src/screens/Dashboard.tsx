import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, getMonthlyOverview } from './financialOverview'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const overview = getMonthlyOverview()

  const indicators = [
    { label: 'Receita', value: formatCurrency(overview.summary.revenue), tone: 'default' },
    { label: 'Despesas', value: formatCurrency(overview.summary.expenses), tone: 'negative' },
    {
      label: 'Resultado',
      value: formatCurrency(overview.summary.operatingResult),
      tone: overview.summary.operatingResult >= 0 ? 'positive' : 'negative',
    },
  ]

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
          <p className={styles.nextStepText}>
            {overview.summary.operatingResult >= 0
              ? 'Resultado positivo no momento. Continue lançando para fechar o mês com segurança.'
              : 'Resultado em queda. Priorize lançar os custos mais recentes para ajustar o mês.'}
          </p>
        </div>
        <div className={styles.nextStepActions}>
          <Button size="sm" onClick={() => navigate('/launch?intent=company')}>Registrar empresa</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/launch?intent=personal')}>
            Registrar pessoal
          </Button>
        </div>
      </Card>

      <div className={styles.indicators}>
        {indicators.map(({ label, value, tone }) => (
          <Card key={label} className={`${styles.indicator} ${tone === 'positive' ? styles.positive : ''} ${tone === 'negative' ? styles.negative : ''}`} padding="regular">
            <span className={styles.indicatorLabel}>{label}</span>
            <span className={styles.indicatorValue}>{value}</span>
          </Card>
        ))}
      </div>
    </ScreenContainer>
  )
}
