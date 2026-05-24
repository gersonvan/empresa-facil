import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatPercent, getMonthlyOverview } from './financialOverview'
import styles from './DRE.module.css'

export default function DRE() {
  const navigate = useNavigate()
  const overview = getMonthlyOverview()

  function downloadTextFile({ content, fileName, mimeType }: { content: string; fileName: string; mimeType: string }) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportSummaryJson() {
    const payload = {
      generatedAt: new Date().toISOString(),
      summary: overview.summary,
      indicators: overview.indicators,
      costGroups: overview.costGroups,
      taxSupport: overview.taxSupport,
    }

    downloadTextFile({
      content: JSON.stringify(payload, null, 2),
      fileName: `dre-resumo-${overview.summary.month}.json`,
      mimeType: 'application/json',
    })
  }

  function exportSummaryCsv() {
    const csvRows = [
      ['mes', overview.summary.month],
      ['regra_fiscal', overview.summary.taxRuleVersion],
      ['receita', String(overview.summary.revenue)],
      ['deducoes', String(overview.summary.deductions)],
      ['despesas', String(overview.summary.expenses)],
      ['receita_financeira', String(overview.summary.financialIncome)],
      ['resultado_operacional', String(overview.summary.operatingResult)],
      ['margem_liquida_percent', String(overview.indicators.netMarginPercent ?? '')],
      ['carga_tributaria_percent', String(overview.indicators.taxBurdenPercent ?? '')],
      ['estimativa_tributos', String(overview.taxSupport.estimatedTax ?? '')],
    ]

    const csv = ['campo,valor', ...csvRows.map(([field, value]) => `${field},"${String(value).replace(/"/g, '""')}"`)].join('\n')

    downloadTextFile({
      content: csv,
      fileName: `dre-resumo-${overview.summary.month}.csv`,
      mimeType: 'text/csv;charset=utf-8',
    })
  }

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
            <Button size="sm" variant="secondary" onClick={exportSummaryJson}>Exportar resumo (JSON)</Button>
            <Button size="sm" variant="secondary" onClick={exportSummaryCsv}>Exportar resumo (CSV)</Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/month-review')}>Abrir fechamento</Button>
          </div>
        </Card>
      </div>
    </ScreenContainer>
  )
}
