import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import MonthNav from '../components/MonthNav'
import { getMonthContext, formatCurrency } from './financialOverview'
import { useMonthNav } from '../hooks/useMonthNav'
import { listLaunchEntries, updateLaunchEntry, type StoredLaunchEntry } from '../launchStore'
import { monthLifecycleStore } from '../monthLifecycle'
import { registerLaunchReview } from '../launchReviewHistoryStore'
import styles from './ImportReview.module.css'

function decision(entry: StoredLaunchEntry, action: 'approve' | 'exclude') {
  const excluded = action === 'exclude'
  updateLaunchEntry(entry.id, {
    flaggedForReview: false,
    reviewStatus: excluded ? 'rejected' : 'approved',
    reconciliationStatus: excluded ? 'confirmed_internal_transfer' : 'not_applicable',
  })
  registerLaunchReview({
    entryId: entry.id,
    companyId: entry.companyId,
    action: excluded ? 'excluded_as_internal_transfer' : 'approved',
    reason: excluded ? 'Confirmado como transferência interna; sem impacto na DRE.' : 'Lançamento importado aprovado como operação da empresa.',
  })
}

export default function ImportReview() {
  const { month: selectedMonth, label, prev, next, isAtLatest } = useMonthNav({ initialMonth: getMonthContext().month, sync: true })
  const monthContext = getMonthContext(selectedMonth)
  const [revision, refresh] = useState(0)
  const [message, setMessage] = useState('')

  const pending = useMemo(
    () => listLaunchEntries({ companyId: monthContext.companyId, month: monthContext.month, costType: 'all', flaggedForReview: true }),
    [monthContext.companyId, monthContext.month, revision]
  )
  const summary = useMemo(() => pending.reduce((totals, entry) => {
    if (entry.dreGroup === 'revenue') totals.revenue += entry.amount
    else if (entry.dreGroup === 'deductions') totals.deductions += entry.amount
    else totals.expenses += entry.amount
    return totals
  }, { revenue: 0, deductions: 0, expenses: 0 }), [pending])

  function checkOpen() {
    if (monthLifecycleStore.isMonthClosed({ companyId: monthContext.companyId, month: monthContext.month })) {
      setMessage('Mês fechado: reabra-o antes de decidir lançamentos importados.')
      return false
    }
    return true
  }

  function approve(entry: StoredLaunchEntry) {
    if (!checkOpen()) return
    decision(entry, 'approve')
    setMessage(`Lançamento “${entry.description}” aprovado.`)
    refresh((value) => value + 1)
  }

  function excludeTransfer(entry: StoredLaunchEntry) {
    if (!checkOpen()) return
    decision(entry, 'exclude')
    setMessage(`Lançamento “${entry.description}” removido da DRE como transferência interna.`)
    refresh((value) => value + 1)
  }

  function approveAll() {
    if (!checkOpen()) return
    pending.forEach((entry) => decision(entry, 'approve'))
    setMessage(`${pending.length} lançamento${pending.length !== 1 ? 's' : ''} aprovado${pending.length !== 1 ? 's' : ''}.`)
    refresh((value) => value + 1)
  }

  return <ScreenContainer title="Revisar importados">
    <div className={styles.monthNav}><MonthNav label={label} onPrev={prev} onNext={next} isAtLatest={isAtLatest} /></div>
    <Card className={styles.summaryCard}>
      <div><strong>{pending.length}</strong><span>pendente{pending.length !== 1 ? 's' : ''}</span></div>
      <div><span>Receitas em revisão</span><strong>{formatCurrency(summary.revenue)}</strong></div>
      <div><span>Despesas em revisão</span><strong>{formatCurrency(summary.expenses)}</strong></div>
      <Button size="sm" onClick={approveAll} disabled={pending.length === 0}>Aprovar operações</Button>
    </Card>
    <p className={styles.explanation}>Aprovar mantém o impacto na DRE. “Transferência interna” exclui o lançamento da DRE, preservando a decisão no histórico.</p>
    {message ? <p className={styles.message} role="status">{message}</p> : null}
    {pending.length === 0 ? <Card><p className={styles.empty}>Nenhum lançamento importado pendente neste mês.</p></Card> : <div className={styles.list}>{pending.map((entry) => <Card key={entry.id} className={styles.item}>
      <div className={styles.itemMain}><strong>{entry.description}</strong><span>{entry.categoryName} · {entry.dreGroup === 'revenue' ? 'Receita' : entry.dreGroup === 'deductions' ? 'Dedução' : 'Despesa'}</span>{entry.reconciliationReason ? <small>{entry.reconciliationReason}</small> : null}</div>
      <strong className={entry.dreGroup === 'revenue' ? styles.positive : styles.negative}>{entry.dreGroup === 'revenue' ? '+' : '−'}{formatCurrency(entry.amount)}</strong>
      <div className={styles.actions}><Button size="sm" onClick={() => approve(entry)}>Aprovar</Button>{entry.reconciliationStatus === 'pending' ? <Button size="sm" variant="secondary" onClick={() => excludeTransfer(entry)}>Transferência interna</Button> : null}</div>
    </Card>)}</div>}
  </ScreenContainer>
}
