import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Button, Card } from '../components/ui'
import { listLaunchEntries } from '../launchStore'
import type { DreGroup } from '../categoryStore'
import { formatCurrency, formatPercent, getMonthContext } from './financialOverview'
import styles from './CategoryInsights.module.css'

type CostTypeFilter = 'all' | 'company' | 'personal'
type ChartScope = 'expenses' | 'deductions' | 'revenue' | 'all'

function dreGroupLabel(dreGroup: DreGroup) {
  if (dreGroup === 'revenue') {
    return 'Receita'
  }

  if (dreGroup === 'deductions') {
    return 'Dedução'
  }

  return 'Despesa'
}

function monthFromNow() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export default function CategoryInsights() {
  const monthContext = getMonthContext()
  const [monthFilter, setMonthFilter] = useState(monthFromNow())
  const [costTypeFilter, setCostTypeFilter] = useState<CostTypeFilter>('all')
  const [chartScope, setChartScope] = useState<ChartScope>('expenses')

  const entries = useMemo(
    () =>
      listLaunchEntries({
      companyId: monthContext.companyId,
      month: monthFilter,
      costType: costTypeFilter,
      }),
    [costTypeFilter, monthContext.companyId, monthFilter]
  )

  const categoryRanking = useMemo(() => {
    const totalsByCategory = new Map<string, number>()

    entries.forEach((entry) => {
      const key = `${entry.categoryName}::${entry.dreGroup}`
      const current = totalsByCategory.get(key) ?? 0
      totalsByCategory.set(key, current + entry.amount)
    })

    const total = Array.from(totalsByCategory.values()).reduce((acc, value) => acc + value, 0)

    return Array.from(totalsByCategory.entries())
      .map(([key, amount]) => {
        const [categoryName, dreGroup] = key.split('::')
        const share = total > 0 ? (amount / total) * 100 : null
        return {
          categoryName,
          dreGroup: dreGroup as DreGroup,
          amount,
          share,
        }
      })
      .sort((left, right) => right.amount - left.amount)
  }, [entries])

  const expensesRanking = useMemo(
    () => categoryRanking.filter((item) => item.dreGroup === 'expenses').slice(0, 5),
    [categoryRanking]
  )

  const revenueRanking = useMemo(
    () => categoryRanking.filter((item) => item.dreGroup === 'revenue').slice(0, 5),
    [categoryRanking]
  )

  const deductionsRanking = useMemo(
    () => categoryRanking.filter((item) => item.dreGroup === 'deductions').slice(0, 5),
    [categoryRanking]
  )

  const chartRanking = useMemo(() => {
    if (chartScope === 'all') {
      return categoryRanking.slice(0, 8)
    }

    return categoryRanking.filter((item) => item.dreGroup === chartScope).slice(0, 8)
  }, [categoryRanking, chartScope])

  const chartMaxAmount = useMemo(
    () => chartRanking.reduce((accumulator, item) => Math.max(accumulator, item.amount), 0),
    [chartRanking]
  )

  const totalInFilter = useMemo(() => entries.reduce((acc, entry) => acc + entry.amount, 0), [entries])

  return (
    <ScreenContainer title="Análise por Categoria">
      <Card className={styles.filtersCard}>
        <h2 className={styles.sectionTitle}>Filtros</h2>
        <div className={styles.filtersGrid}>
          <label className={styles.field} htmlFor="insights-month-filter">
            <span>Mês</span>
            <input
              id="insights-month-filter"
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
            />
          </label>
          <label className={styles.field} htmlFor="insights-type-filter">
            <span>Tipo</span>
            <select
              id="insights-type-filter"
              value={costTypeFilter}
              onChange={(event) => setCostTypeFilter(event.target.value as CostTypeFilter)}
            >
              <option value="all">Todos</option>
              <option value="company">Empresa</option>
              <option value="personal">Pessoal</option>
            </select>
          </label>
          <label className={styles.field} htmlFor="insights-chart-scope">
            <span>Escopo do gráfico</span>
            <select
              id="insights-chart-scope"
              value={chartScope}
              onChange={(event) => setChartScope(event.target.value as ChartScope)}
            >
              <option value="expenses">Despesas</option>
              <option value="deductions">Deduções</option>
              <option value="revenue">Receitas</option>
              <option value="all">Tudo</option>
            </select>
          </label>
        </div>
      </Card>

      <div className={styles.kpiGrid}>
        <Card>
          <p className={styles.kpiLabel}>Total no recorte</p>
          <strong className={styles.kpiValue}>{formatCurrency(totalInFilter)}</strong>
        </Card>
        <Card>
          <p className={styles.kpiLabel}>Categorias ativas</p>
          <strong className={styles.kpiValue}>{categoryRanking.length}</strong>
        </Card>
      </div>

      <Card>
        <h2 className={styles.sectionTitle}>Distribuição por categoria (gráfico)</h2>
        {chartRanking.length === 0 ? (
          <p className={styles.emptyState}>Nenhum lançamento encontrado para os filtros atuais.</p>
        ) : (
          <ul className={styles.chartList}>
            {chartRanking.map((item) => (
              <li key={`${item.categoryName}-${item.dreGroup}`} className={styles.chartRow}>
                <div className={styles.rowInfo}>
                  <p className={styles.rowTitle}>{item.categoryName}</p>
                  <p className={styles.rowMeta}>
                    {dreGroupLabel(item.dreGroup)} · {formatPercent(item.share)} do total filtrado
                  </p>
                </div>
                <div className={styles.chartBarWrap}>
                  <div
                    className={styles.chartBar}
                    style={{ width: `${chartMaxAmount > 0 ? (item.amount / chartMaxAmount) * 100 : 0}%` }}
                  />
                </div>
                <strong className={styles.rowAmount}>{formatCurrency(item.amount)}</strong>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className={styles.dualGrid}>
        <Card>
          <h2 className={styles.sectionTitle}>Top despesas por categoria</h2>
          {expensesRanking.length === 0 ? (
            <p className={styles.emptyState}>Sem despesas para os filtros atuais.</p>
          ) : (
            <ul className={styles.list}>
              {expensesRanking.map((item, index) => (
                <li key={`expenses-${item.categoryName}`} className={styles.row}>
                  <div className={styles.rowInfo}>
                    <p className={styles.rowTitle}>
                      #{index + 1} {item.categoryName}
                    </p>
                    <p className={styles.rowMeta}>{formatPercent(item.share)} do total filtrado</p>
                  </div>
                  <strong className={styles.rowAmount}>{formatCurrency(item.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Top receitas por categoria</h2>
          {revenueRanking.length === 0 ? (
            <p className={styles.emptyState}>Sem receitas para os filtros atuais.</p>
          ) : (
            <ul className={styles.list}>
              {revenueRanking.map((item, index) => (
                <li key={`revenue-${item.categoryName}`} className={styles.row}>
                  <div className={styles.rowInfo}>
                    <p className={styles.rowTitle}>
                      #{index + 1} {item.categoryName}
                    </p>
                    <p className={styles.rowMeta}>{formatPercent(item.share)} do total filtrado</p>
                  </div>
                  <strong className={styles.rowAmount}>{formatCurrency(item.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Top deduções por categoria</h2>
          {deductionsRanking.length === 0 ? (
            <p className={styles.emptyState}>Sem deduções para os filtros atuais.</p>
          ) : (
            <ul className={styles.list}>
              {deductionsRanking.map((item, index) => (
                <li key={`deductions-${item.categoryName}`} className={styles.row}>
                  <div className={styles.rowInfo}>
                    <p className={styles.rowTitle}>
                      #{index + 1} {item.categoryName}
                    </p>
                    <p className={styles.rowMeta}>{formatPercent(item.share)} do total filtrado</p>
                  </div>
                  <strong className={styles.rowAmount}>{formatCurrency(item.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className={styles.actions}>
        <Button size="sm" variant={chartScope === 'expenses' ? 'primary' : 'outline'} onClick={() => setChartScope('expenses')}>
          Gráfico de despesas
        </Button>
        <Button size="sm" variant={chartScope === 'deductions' ? 'primary' : 'outline'} onClick={() => setChartScope('deductions')}>
          Gráfico de deduções
        </Button>
        <Button size="sm" variant={chartScope === 'revenue' ? 'primary' : 'outline'} onClick={() => setChartScope('revenue')}>
          Gráfico de receitas
        </Button>
        <Button size="sm" variant={chartScope === 'all' ? 'primary' : 'outline'} onClick={() => setChartScope('all')}>
          Gráfico completo
        </Button>
      </div>
    </ScreenContainer>
  )
}
