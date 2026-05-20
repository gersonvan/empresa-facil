import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card } from '../components/ui'
import { formatCurrency, getMonthContext } from './financialOverview'
import { listLaunchEntries } from '../launchStore'
import styles from './Records.module.css'

type CostTypeFilter = 'all' | 'company' | 'personal'

function monthFromNow() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function costTypeLabel(costType: 'company' | 'personal') {
  return costType === 'company' ? 'Empresa' : 'Pessoal'
}

export default function Records() {
  const monthContext = getMonthContext()
  const [monthFilter, setMonthFilter] = useState(monthFromNow())
  const [costTypeFilter, setCostTypeFilter] = useState<CostTypeFilter>('all')

  const entries = useMemo(
    () =>
      listLaunchEntries({
        companyId: monthContext.companyId,
        month: monthFilter,
        costType: costTypeFilter,
      }),
    [costTypeFilter, monthContext.companyId, monthFilter]
  )

  const summary = useMemo(() => {
    return entries.reduce(
      (accumulator, entry) => {
        accumulator.total += entry.amount
        if (entry.costType === 'company') {
          accumulator.company += entry.amount
        } else {
          accumulator.personal += entry.amount
        }
        return accumulator
      },
      { total: 0, company: 0, personal: 0 }
    )
  }, [entries])

  return (
    <ScreenContainer title="Ver Registros">
      <Card className={styles.filtersCard}>
        <h2 className={styles.sectionTitle}>Filtros</h2>
        <div className={styles.filtersGrid}>
          <label className={styles.field} htmlFor="records-month-filter">
            <span>Mês</span>
            <input
              id="records-month-filter"
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
            />
          </label>
          <label className={styles.field} htmlFor="records-type-filter">
            <span>Tipo</span>
            <select
              id="records-type-filter"
              value={costTypeFilter}
              onChange={(event) => setCostTypeFilter(event.target.value as CostTypeFilter)}
            >
              <option value="all">Todos</option>
              <option value="company">Empresa</option>
              <option value="personal">Pessoal</option>
            </select>
          </label>
        </div>
      </Card>

      <div className={styles.kpiGrid}>
        <Card>
          <p className={styles.kpiLabel}>Total no filtro</p>
          <strong className={styles.kpiValue}>{formatCurrency(summary.total)}</strong>
        </Card>
        <Card>
          <p className={styles.kpiLabel}>Empresa</p>
          <strong className={styles.kpiValue}>{formatCurrency(summary.company)}</strong>
        </Card>
        <Card>
          <p className={styles.kpiLabel}>Pessoal</p>
          <strong className={styles.kpiValue}>{formatCurrency(summary.personal)}</strong>
        </Card>
      </div>

      <Card>
        <h2 className={styles.sectionTitle}>Lançamentos</h2>
        {entries.length === 0 ? (
          <p className={styles.emptyState}>Nenhum lançamento encontrado para os filtros atuais.</p>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <div className={styles.rowInfo}>
                  <p className={styles.rowTitle}>{entry.description}</p>
                  <p className={styles.rowMeta}>
                    {costTypeLabel(entry.costType)} · {entry.month}
                  </p>
                </div>
                <strong className={styles.rowAmount}>{formatCurrency(entry.amount)}</strong>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </ScreenContainer>
  )
}
