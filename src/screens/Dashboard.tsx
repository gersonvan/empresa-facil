import { useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import MonthNav from '../components/MonthNav'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatPercent, getMonthContext, getMonthlyOverview } from './financialOverview'
import { listLaunchEntries, saveLaunchEntry } from '../launchStore'
import { listRecurringTemplates, removeRecurringTemplate } from '../recurringStore'
import { monthLifecycleStore } from '../monthLifecycle'
import { useMonthNav, currentMonth } from '../hooks/useMonthNav'
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
    sync: true,
  })

  const overview = getMonthlyOverview(month)
  const monthContext = getMonthContext(month)

  const topCategoryExpenses = listLaunchEntries({
    companyId: monthContext.companyId,
    month: monthContext.month,
    costType: 'all',
  })
    .filter((entry) => entry.dreGroup === 'expenses')
    .reduce<Map<string, { categoryId: string; amount: number }>>((accumulator, entry) => {
      const current = accumulator.get(entry.categoryName)
      accumulator.set(entry.categoryName, { categoryId: entry.categoryId, amount: (current?.amount ?? 0) + entry.amount })
      return accumulator
    }, new Map())

  const totalEntries = listLaunchEntries({ companyId: monthContext.companyId, month, costType: 'all' }).length

  const [recurringApplied, setRecurringApplied] = useState(false)

  const pendingRecurring = listRecurringTemplates({ companyId: monthContext.companyId }).filter((t) => {
    const existingDescs = listLaunchEntries({ companyId: t.companyId, month, costType: t.costType })
      .map((e) => e.description)
    return !existingDescs.includes(t.description)
  })

  function applyRecurring() {
    const now = new Date().toISOString()
    for (const t of pendingRecurring) {
      saveLaunchEntry({
        id: `rec-apply-${t.id}-${month}-${Date.now()}`,
        companyId: t.companyId,
        month,
        costType: t.costType,
        dreGroup: t.dreGroup,
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        description: t.description,
        amount: t.amount,
        createdAt: now,
      })
    }
    setRecurringApplied(true)
  }

  const topCategoryRows = Array.from(topCategoryExpenses.entries())
    .map(([categoryName, { categoryId, amount }]) => ({ categoryName, categoryId, amount }))
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

  const monthStatus = monthLifecycleStore.getStatus({ companyId: monthContext.companyId, month })
  const todayDay = new Date().getDate()
  const isCurrentMonth = month === currentMonth()
  const daysLeft = isCurrentMonth ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - todayDay : null

  function getNextStepMessage(): { title: string; text: string } {
    if (monthStatus.status === 'closed') {
      return { title: 'Mês fechado', text: `${label} está fechado. Navegue para outro mês ou acesse "Fechar Mês" para ver o relatório.` }
    }
    if (monthStatus.status === 'in_review') {
      return { title: 'Em revisão pelo contador', text: `${label} foi enviado para revisão. Aguarde o retorno ou acesse "Fechar Mês" para acompanhar.` }
    }
    if (pendingRecurring.length > 0 && !recurringApplied) {
      return { title: `${pendingRecurring.length} lançamento${pendingRecurring.length > 1 ? 's' : ''} recorrente${pendingRecurring.length > 1 ? 's' : ''} pendente${pendingRecurring.length > 1 ? 's' : ''}`, text: 'Clique em "Aplicar" no card abaixo para registrá-los automaticamente no mês.' }
    }
    if (daysLeft !== null && daysLeft <= 5) {
      return { title: `Faltam ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} para fechar ${label}`, text: 'Confira se todos os lançamentos estão registrados antes de enviar para revisão.' }
    }
    if (overview.summary.operatingResult < 0) {
      return { title: 'Resultado negativo no momento', text: 'As despesas superam a receita. Lance as últimas receitas ou revise as despesas do mês.' }
    }
    return { title: 'Tudo certo por aqui', text: 'Resultado positivo. Continue lançando para fechar o mês com segurança.' }
  }

  const nextStep = getNextStepMessage()

  const { revenue, expenses, operatingResult } = overview.summary
  const expenseRatio = revenue > 0 ? expenses / revenue : 0
  const health =
    revenue === 0
      ? { tone: 'yellow', status: 'Sem dados no mês', detail: 'Lance receitas e despesas para ver a saúde financeira.', badge: '—' }
      : operatingResult < 0
        ? { tone: 'red', status: 'Resultado negativo', detail: `As despesas superam a receita em ${formatCurrency(Math.abs(operatingResult))}.`, badge: 'Prejuízo' }
        : expenseRatio > 0.8
          ? { tone: 'yellow', status: 'Atenção: margem apertada', detail: `${formatPercent(expenseRatio * 100)} da receita está comprometida com despesas.`, badge: 'Atenção' }
          : { tone: 'green', status: 'Resultado saudável', detail: `Margem operacional de ${formatPercent((operatingResult / revenue) * 100)} no mês.`, badge: 'Saudável' }

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

      <Card className={styles.healthCard}>
        <div className={`${styles.healthDot} ${styles[health.tone]}`} aria-hidden="true" />
        <div className={styles.healthBody}>
          <p className={`${styles.healthStatus} ${styles[health.tone]}`}>{health.status}</p>
          <p className={styles.healthDetail}>{health.detail}</p>
        </div>
        <span className={`${styles.healthBadge} ${styles[health.tone]}`}>{health.badge}</span>
      </Card>

      {pendingRecurring.length > 0 && !recurringApplied && (
        <Card className={styles.recurringCard}>
          <div className={styles.recurringBody}>
            <p className={styles.recurringTitle}>🔁 {pendingRecurring.length} lançamento{pendingRecurring.length > 1 ? 's' : ''} recorrente{pendingRecurring.length > 1 ? 's' : ''} pendente{pendingRecurring.length > 1 ? 's' : ''}</p>
            <ul className={styles.recurringList}>
              {pendingRecurring.map((t) => (
                <li key={t.id}>
                  <span>{t.description}</span>
                  <span>{formatCurrency(t.amount)}</span>
                  <button type="button" className={styles.recurringRemoveBtn} onClick={() => removeRecurringTemplate(t.id)} title="Remover recorrente">✕</button>
                </li>
              ))}
            </ul>
          </div>
          <Button size="sm" onClick={applyRecurring}>Aplicar ao mês de {label}</Button>
        </Card>
      )}

      <Card className={styles.nextStepCard} padding="compact">
        <div className={styles.nextStepHeader}>
          <h2 className={styles.nextStepTitle}>{nextStep.title}</h2>
          <p className={styles.nextStepText}>{nextStep.text}</p>
        </div>
        <div className={styles.nextStepActions}>
          <Button size="sm" onClick={() => navigate('/launch?intent=company')}>Registrar empresa</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/launch?intent=personal')}>
            Registrar pessoal
          </Button>
        </div>
      </Card>

      {totalEntries === 0 ? (
        <Card className={styles.emptyState}>
          <p className={styles.emptyTitle}>Nenhum lançamento em {label}</p>
          <p className={styles.emptyText}>Registre sua primeira receita ou despesa para começar a acompanhar seus resultados.</p>
          <div className={styles.emptyActions}>
            <Button onClick={() => navigate('/launch?intent=company')}>Registrar lançamento da empresa</Button>
            <Button variant="secondary" onClick={() => navigate('/launch?intent=personal')}>Registrar gasto pessoal</Button>
          </div>
        </Card>
      ) : (
        <>
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
              <p className={styles.categoryEmpty}>Sem despesas registradas no mês.</p>
            ) : (
              <ul className={styles.categoryList}>
                {topCategoryRows.map((row, index) => (
                  <li key={row.categoryName}>
                    <button
                      type="button"
                      className={styles.categoryRow}
                      onClick={() => navigate(`/records?mes=${month}&categoria=${row.categoryId}`)}
                    >
                      <span className={styles.categoryName}>#{index + 1} {row.categoryName}</span>
                      <strong className={styles.categoryAmount}>{formatCurrency(row.amount)}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </ScreenContainer>
  )
}
