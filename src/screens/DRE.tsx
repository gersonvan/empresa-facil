import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { getActiveCompany } from '../companyStore'
import { listLaunchEntries } from '../launchStore'
import { formatCurrency, formatPercent, getMonthContext, getMonthlyOverview } from './financialOverview'
import styles from './DRE.module.css'

interface DetailedRow {
  label: string
  amount: number
}

interface DetailedSection {
  key: 'revenue' | 'deductions' | 'expenses'
  title: string
  rows: DetailedRow[]
  total: number
}

interface BucketSection {
  title: string
  rows: DetailedRow[]
  total: number
}

function toMonthLabel(month: string) {
  const [year, monthRaw] = month.split('-')
  return `${monthRaw}/${year}`
}

function formatCnpj(cnpj?: string) {
  const digits = (cnpj ?? '').replace(/\D/g, '')
  if (digits.length !== 14) {
    return 'Não informado'
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function formatStatementValue(value: number, options: { enforceNegativeStyle?: boolean } = {}) {
  const { enforceNegativeStyle = false } = options
  if (value < 0 || enforceNegativeStyle) {
    return `(${formatCurrency(Math.abs(value))})`
  }

  return formatCurrency(value)
}

function buildDetailedSections({ companyId, month }: { companyId: string; month: string }): DetailedSection[] {
  const entries = listLaunchEntries({ companyId, month, costType: 'company' })

  const sections = {
    revenue: new Map<string, number>(),
    deductions: new Map<string, number>(),
    expenses: new Map<string, number>(),
  }

  for (const entry of entries) {
    if (entry.dreGroup === 'revenue') {
      const current = sections.revenue.get(entry.categoryName) ?? 0
      sections.revenue.set(entry.categoryName, current + entry.amount)
      continue
    }

    if (entry.dreGroup === 'deductions') {
      const current = sections.deductions.get(entry.categoryName) ?? 0
      sections.deductions.set(entry.categoryName, current + entry.amount)
      continue
    }

    const current = sections.expenses.get(entry.categoryName) ?? 0
    sections.expenses.set(entry.categoryName, current + entry.amount)
  }

  function mapRows(group: Map<string, number>) {
    return [...group.entries()]
      .map(([label, amount]) => ({ label, amount }))
      .sort((left, right) => right.amount - left.amount)
  }

  const revenueRows = mapRows(sections.revenue)
  const deductionRows = mapRows(sections.deductions)
  const expenseRows = mapRows(sections.expenses)

  return [
    {
      key: 'revenue',
      title: 'RECEITA BRUTA',
      rows: revenueRows,
      total: revenueRows.reduce((accumulator, row) => accumulator + row.amount, 0),
    },
    {
      key: 'deductions',
      title: 'DEDUÇÕES',
      rows: deductionRows,
      total: deductionRows.reduce((accumulator, row) => accumulator + row.amount, 0),
    },
    {
      key: 'expenses',
      title: 'DESPESAS OPERACIONAIS',
      rows: expenseRows,
      total: expenseRows.reduce((accumulator, row) => accumulator + row.amount, 0),
    },
  ]
}

function classifyExpenseBucket(categoryName: string) {
  const normalized = categoryName.toLocaleLowerCase('pt-BR')

  if (
    normalized.includes('imposto') ||
    normalized.includes('tribut') ||
    normalized.includes('taxa') ||
    normalized.includes('fgts') ||
    normalized.includes('inss') ||
    normalized.includes('simples')
  ) {
    return 'taxes'
  }

  if (
    normalized.includes('cartão') ||
    normalized.includes('cartao') ||
    normalized.includes('banc') ||
    normalized.includes('juros') ||
    normalized.includes('financi') ||
    normalized.includes('emprést') ||
    normalized.includes('emprest') ||
    normalized.includes('parcel') ||
    normalized.includes('tarifa')
  ) {
    return 'financial'
  }

  if (
    normalized.includes('frete') ||
    normalized.includes('logística') ||
    normalized.includes('logistica') ||
    normalized.includes('matéria') ||
    normalized.includes('materia') ||
    normalized.includes('insumo') ||
    normalized.includes('estoque') ||
    normalized.includes('terceir') ||
    normalized.includes('comiss') ||
    normalized.includes('produção') ||
    normalized.includes('produc') ||
    normalized.includes('custo direto')
  ) {
    return 'direct'
  }

  return 'operational'
}

function buildExpenseBuckets(entries: Array<{ categoryName: string; amount: number }>): BucketSection[] {
  const buckets = {
    direct: new Map<string, number>(),
    operational: new Map<string, number>(),
    financial: new Map<string, number>(),
    taxes: new Map<string, number>(),
  }

  for (const entry of entries) {
    const bucket = classifyExpenseBucket(entry.categoryName)
    const current = buckets[bucket].get(entry.categoryName) ?? 0
    buckets[bucket].set(entry.categoryName, current + entry.amount)
  }

  function mapRows(group: Map<string, number>) {
    return [...group.entries()]
      .map(([label, amount]) => ({ label, amount }))
      .sort((left, right) => right.amount - left.amount)
  }

  return [
    {
      title: 'CUSTOS DIRETOS',
      rows: mapRows(buckets.direct),
      total: [...buckets.direct.values()].reduce((accumulator, amount) => accumulator + amount, 0),
    },
    {
      title: 'DESPESAS ADMINISTRATIVAS / OPERACIONAIS',
      rows: mapRows(buckets.operational),
      total: [...buckets.operational.values()].reduce((accumulator, amount) => accumulator + amount, 0),
    },
    {
      title: 'DESPESAS FINANCEIRAS',
      rows: mapRows(buckets.financial),
      total: [...buckets.financial.values()].reduce((accumulator, amount) => accumulator + amount, 0),
    },
    {
      title: 'IMPOSTOS, TAXAS E CONTRIBUIÇÕES',
      rows: mapRows(buckets.taxes),
      total: [...buckets.taxes.values()].reduce((accumulator, amount) => accumulator + amount, 0),
    },
  ]
}

export default function DRE() {
  const navigate = useNavigate()
  const overview = getMonthlyOverview()
  const monthContext = getMonthContext()
  const activeCompany = getActiveCompany()
  const detailedSections = buildDetailedSections({ companyId: monthContext.companyId, month: monthContext.month })
  const expenseEntries = listLaunchEntries({ companyId: monthContext.companyId, month: monthContext.month, costType: 'company' })
    .filter((entry) => entry.dreGroup === 'expenses')
    .map((entry) => ({ categoryName: entry.categoryName, amount: entry.amount }))
  const expenseBuckets = buildExpenseBuckets(expenseEntries)
  const financialIncome = overview.summary.financialIncome

  const revenueTotal = detailedSections.find((section) => section.key === 'revenue')?.total ?? 0
  const deductionsTotal = detailedSections.find((section) => section.key === 'deductions')?.total ?? 0
  const expensesTotal = expenseBuckets.reduce((accumulator, section) => accumulator + section.total, 0)
  const netRevenue = revenueTotal - deductionsTotal
  const resultBeforeFinancial = netRevenue - expensesTotal
  const operatingResult = resultBeforeFinancial + financialIncome

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
        <Card className={styles.reportCard}>
          <header className={styles.reportHeader}>
            <p>
              <strong>Empresa:</strong> {activeCompany?.name ?? monthContext.companyName}
            </p>
            <p>
              <strong>C.N.P.J.:</strong> {formatCnpj(activeCompany?.cnpj)}
            </p>
            <p>
              <strong>Demonstração do Resultado do Exercício:</strong> {toMonthLabel(monthContext.month)}
            </p>
          </header>

          <section className={styles.statementTable} aria-label="Demonstrativo DRE detalhado">
            {detailedSections.map((section) => (
              <div key={section.key} className={styles.statementSection}>
                <div className={styles.statementSectionHeader}>
                  <h2 className={styles.statementTitle}>{section.title}</h2>
                  <strong className={styles.statementTotal}>
                    {formatStatementValue(section.total, {
                      enforceNegativeStyle: section.key !== 'revenue',
                    })}
                  </strong>
                </div>

                {section.rows.length === 0 ? (
                  <p className={styles.emptyState}>Sem lançamentos neste bloco para o mês selecionado.</p>
                ) : (
                  <ul className={styles.statementRows}>
                    {section.rows.map((row) => (
                      <li key={`${section.key}-${row.label}`} className={styles.statementRow}>
                        <span>{row.label}</span>
                        <strong>
                          {formatStatementValue(row.amount, {
                            enforceNegativeStyle: section.key !== 'revenue',
                          })}
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className={styles.bucketGrid}>
              {expenseBuckets.map((bucket) => (
                <div key={bucket.title} className={styles.bucketSection}>
                  <div className={styles.statementSectionHeader}>
                    <h2 className={styles.statementTitle}>{bucket.title}</h2>
                    <strong className={styles.statementTotal}>{formatStatementValue(bucket.total, { enforceNegativeStyle: true })}</strong>
                  </div>

                  {bucket.rows.length === 0 ? (
                    <p className={styles.emptyState}>Sem lançamentos neste bloco para o mês selecionado.</p>
                  ) : (
                    <ul className={styles.statementRows}>
                      {bucket.rows.map((row) => (
                        <li key={`${bucket.title}-${row.label}`} className={styles.statementRow}>
                          <span>{row.label}</span>
                          <strong>{formatStatementValue(row.amount, { enforceNegativeStyle: true })}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.statementSection}>
              <div className={styles.statementSectionHeader}>
                <h2 className={styles.statementTitle}>RECEITAS FINANCEIRAS</h2>
                <strong className={styles.statementTotal}>{formatStatementValue(financialIncome)}</strong>
              </div>

              {financialIncome === 0 ? (
                <p className={styles.emptyState}>Sem lançamentos financeiros no mês selecionado.</p>
              ) : (
                <ul className={styles.statementRows}>
                  <li className={styles.statementRow}>
                    <span>Receitas financeiras</span>
                    <strong>{formatStatementValue(financialIncome)}</strong>
                  </li>
                </ul>
              )}
            </div>

            <div className={styles.finalTotals}>
              <div className={styles.finalRow}>
                <span>RECEITA LÍQUIDA</span>
                <strong>{formatStatementValue(netRevenue)}</strong>
              </div>
              <div className={styles.finalRow}>
                <span>RESULTADO ANTES DAS RECEITAS FINANCEIRAS</span>
                <strong className={resultBeforeFinancial >= 0 ? styles.pos : styles.neg}>
                  {formatStatementValue(resultBeforeFinancial)}
                </strong>
              </div>
              <div className={styles.finalRow}>
                <span>RESULTADO OPERACIONAL</span>
                <strong className={operatingResult >= 0 ? styles.pos : styles.neg}>
                  {formatStatementValue(operatingResult)}
                </strong>
              </div>
            </div>
          </section>
        </Card>

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
