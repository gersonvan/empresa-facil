import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Button, Card, Input } from '../components/ui'
import { formatCurrency, getMonthContext } from './financialOverview'
import { getLaunchEntryById, listLaunchEntries, updateLaunchEntry, type EntryReviewStatus } from '../launchStore'
import styles from './DeductionReview.module.css'

type ReviewFilter = 'all' | EntryReviewStatus

function monthFromNow() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function parseBrazilianAmount(rawValue: string) {
  return Number(rawValue.replace(/\./g, '').replace(',', '.'))
}

function formatAmountInput(rawValue: string) {
  const digitsOnly = rawValue.replace(/\D/g, '')
  if (!digitsOnly) {
    return ''
  }

  const normalized = digitsOnly.padStart(3, '0')
  const integerPart = normalized.slice(0, -2)
  const decimalPart = normalized.slice(-2)
  const integerValue = Number(integerPart)

  return `${integerValue.toLocaleString('pt-BR')},${decimalPart}`
}

function formatAmountForInput(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function reviewLabel(status: EntryReviewStatus) {
  if (status === 'suggested') {
    return 'Sugerido'
  }

  if (status === 'approved') {
    return 'Aprovado'
  }

  if (status === 'rejected') {
    return 'Rejeitado'
  }

  return 'Editado'
}

export default function DeductionReview() {
  const monthContext = getMonthContext()
  const [monthFilter, setMonthFilter] = useState(monthFromNow())
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
  const [bracketFilter, setBracketFilter] = useState<string>('all')
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState('')
  const [message, setMessage] = useState('')

  const deductionEntries = useMemo(() => {
    const entries = listLaunchEntries({
      companyId: monthContext.companyId,
      month: monthFilter,
      costType: 'company',
    }).filter((entry) => entry.sourceType === 'tax_estimation' && entry.linkedEntryId)

    return entries
      .filter((entry) => (reviewFilter === 'all' ? true : entry.reviewStatus === reviewFilter))
      .filter((entry) => {
        if (bracketFilter === 'all') {
          return true
        }

        return entry.estimationSnapshot?.matchedBracketId === bracketFilter
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }, [monthContext.companyId, monthFilter, reviewFilter, bracketFilter])

  const availableBrackets = useMemo(() => {
    const values = new Set<string>()
    for (const entry of deductionEntries) {
      if (entry.estimationSnapshot?.matchedBracketId) {
        values.add(entry.estimationSnapshot.matchedBracketId)
      }
    }

    return Array.from(values).sort((left, right) => left.localeCompare(right, 'pt-BR'))
  }, [deductionEntries])

  function updateStatus(entryId: string, status: EntryReviewStatus) {
    try {
      updateLaunchEntry(entryId, { reviewStatus: status })
      setMessage(`Status atualizado para ${reviewLabel(status)}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao atualizar status.')
    }
  }

  function startEdit(entryId: string, amount: number) {
    setEditingEntryId(entryId)
    setEditingAmount(formatAmountForInput(amount))
    setMessage('')
  }

  function saveEdit() {
    if (!editingEntryId) {
      return
    }

    const amount = parseBrazilianAmount(editingAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Informe um valor válido para salvar.')
      return
    }

    try {
      updateLaunchEntry(editingEntryId, { amount, reviewStatus: 'edited' })
      setEditingEntryId(null)
      setEditingAmount('')
      setMessage('Valor ajustado e item marcado como Editado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao salvar edição.')
    }
  }

  return (
    <ScreenContainer title="Revisão de Deduções">
      <Card className={styles.filtersCard}>
        <h2 className={styles.sectionTitle}>Filtros</h2>
        <div className={styles.filtersGrid}>
          <label className={styles.field} htmlFor="deduction-month-filter">
            <span>Mês</span>
            <input
              id="deduction-month-filter"
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
            />
          </label>

          <label className={styles.field} htmlFor="deduction-status-filter">
            <span>Status</span>
            <select
              id="deduction-status-filter"
              value={reviewFilter}
              onChange={(event) => setReviewFilter(event.target.value as ReviewFilter)}
            >
              <option value="all">Todos</option>
              <option value="suggested">Sugerido</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="edited">Editado</option>
            </select>
          </label>

          <label className={styles.field} htmlFor="deduction-bracket-filter">
            <span>Faixa aplicada</span>
            <select
              id="deduction-bracket-filter"
              value={bracketFilter}
              onChange={(event) => setBracketFilter(event.target.value)}
            >
              <option value="all">Todas</option>
              {availableBrackets.map((bracketId) => (
                <option key={bracketId} value={bracketId}>
                  {bracketId}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Itens previstos</h2>
        <p className={styles.meta}>Empresa: {monthContext.companyName}</p>
        <p className={styles.warning}>
          Estes valores sao estimativas operacionais e devem ser validados pelo contador no fechamento.
        </p>

        {message ? (
          <p className={styles.message} role="status">
            {message}
          </p>
        ) : null}

        {deductionEntries.length === 0 ? (
          <p className={styles.emptyState}>Nenhuma dedução prevista encontrada para os filtros selecionados.</p>
        ) : (
          <ul className={styles.list}>
            {deductionEntries.map((entry) => {
              const linkedRevenue = entry.linkedEntryId ? getLaunchEntryById(entry.linkedEntryId) : null
              const status = entry.reviewStatus ?? 'approved'
              const isEditing = editingEntryId === entry.id

              return (
                <li key={entry.id} className={styles.row}>
                  <div className={styles.rowHeader}>
                    <p className={styles.rowTitle}>{entry.description}</p>
                    <span className={styles.statusBadge}>{reviewLabel(status)}</span>
                  </div>

                  <p className={styles.rowMeta}>
                    Receita vinculada: {linkedRevenue?.description ?? 'Não encontrada'}
                  </p>
                  <p className={styles.rowMeta}>
                    Faixa: {entry.estimationSnapshot?.matchedBracketId ?? '—'} · Alíquota: {entry.estimationSnapshot?.matchedRate ?? 0}%
                  </p>

                  {isEditing ? (
                    <div className={styles.editPanel}>
                      <Input
                        label="Valor da dedução"
                        inputMode="decimal"
                        value={editingAmount}
                        onChange={(event) => setEditingAmount(formatAmountInput(event.target.value))}
                      />
                      <div className={styles.actions}>
                        <Button size="sm" onClick={saveEdit}>
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEntryId(null)
                            setEditingAmount('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.rowFooter}>
                      <strong className={styles.amount}>{formatCurrency(entry.amount)}</strong>
                      <div className={styles.actions}>
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(entry.id, 'approved')}>
                          Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, 'rejected')}>
                          Rejeitar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(entry.id, entry.amount)}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </ScreenContainer>
  )
}
