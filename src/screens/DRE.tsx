import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { formatCurrency, formatPercent, getMonthlyOverview } from './financialOverview'
import styles from './DRE.module.css'

export default function DRE() {
  const overview = getMonthlyOverview()

  return (
    <ScreenContainer title="DRE">
      <div className={styles.grid}>
        <Card className={styles.summaryCard}>
          <h2 className={styles.sectionTitle}>Resumo do mês</h2>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>Receita</dt>
              <dd>{formatCurrency(overview.summary.revenue)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Deduções</dt>
              <dd>{formatCurrency(overview.summary.deductions)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Despesas</dt>
              <dd>{formatCurrency(overview.summary.expenses)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Resultado operacional</dt>
              <dd className={overview.summary.operatingResult >= 0 ? styles.pos : styles.neg}>
                {formatCurrency(overview.summary.operatingResult)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Composição de custos</h2>
          <ul className={styles.groupList}>
            {overview.costGroups.map((group) => (
              <li key={group.key} className={styles.groupRow}>
                <div>
                  <p className={styles.groupLabel}>{group.label === 'Deductions' ? 'Deduções' : 'Despesas'}</p>
                  <p className={styles.groupShare}>{formatPercent(group.shareOfRevenuePercent)} da receita</p>
                </div>
                <strong>{formatCurrency(group.amount)}</strong>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Button size="sm" variant="secondary">Exportar resumo</Button>
            <Button size="sm" variant="outline">Abrir fechamento</Button>
          </div>
        </Card>
      </div>
    </ScreenContainer>
  )
}
