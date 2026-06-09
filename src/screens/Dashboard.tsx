import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import MonthNav from '../components/MonthNav'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, getMonthContext, getMonthlyOverview } from './financialOverview'
import { listLaunchEntries } from '../launchStore'
import { useMonthNav } from '../hooks/useMonthNav'
import { useSubscription, oldestAllowedMonth } from '../hooks/useSubscription'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const subscription = useSubscription()
  const oldest = oldestAllowedMonth(subscription?.historyMonths ?? null)
  // Inicia no mês inferido (mês atual ou último com lançamentos)
  const inferredMonth = getMonthContext().month
  const { month, label, prev, next, isAtLatest, isAtOldest } = useMonthNav({
    initialMonth: inferredMonth,
    oldestAllowedMonth: oldest,
  })

  const overview = getMonthlyOverview(month)
  const monthContext = getMonthContext(month)

  const topCategoryExpenses = listLaunchEntries({
    companyId: monthContext.companyId,
    month: monthContext.month,
    costType: 'all',
  })
    .filter((entry) => entry.dreGroup === 'expenses')
    .reduce<Map<string, number>>((accumulator, entry) => {
      const current = accumulator.get(entry.categoryName) ?? 0
      accumulator.set(entry.categoryName, current + entry.amount)
      return accumulator
    }, new Map())

  const topCategoryRows = Array.from(topCategoryExpenses.entries())
    .map(([categoryName, amount]) => ({ categoryName, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5)

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
        <MonthNav
          label={label}
          onPrev={prev}
          onNext={next}
          isAtLatest={isAtLatest}
          isAtOldest={isAtOldest}
          showUpgradeHint={isAtOldest && subscription?.plan === 'free'}
        />
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

      <Card className={styles.categoryCard}>
        <div className={styles.categoryHeader}>
          <h2 className={styles.categoryTitle}>Top 5 gastos por categoria</h2>
          <Button size="sm" variant="outline" onClick={() => navigate('/category-insights')}>
            Ver análise completa
          </Button>
        </div>
        {topCategoryRows.length === 0 ? (
          <p className={styles.categoryEmpty}>Sem despesas por categoria no mês atual.</p>
        ) : (
          <ul className={styles.categoryList}>
            {topCategoryRows.map((row, index) => (
              <li key={row.categoryName} className={styles.categoryRow}>
                <span className={styles.categoryName}>#{index + 1} {row.categoryName}</span>
                <strong className={styles.categoryAmount}>{formatCurrency(row.amount)}</strong>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </ScreenContainer>
  )
}
