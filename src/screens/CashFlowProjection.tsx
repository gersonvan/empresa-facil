import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Button, Card } from '../components/ui'
import { getMonthContext, formatCurrency } from './financialOverview'
import {
  advanceInstallment,
  listCommitmentHistory,
  listCommitments,
  removeCommitment,
  saveCommitment,
  type CommitmentAuditAction,
  updateCommitment,
  type CommitmentCostType,
  type StoredCommitment,
} from '../commitmentStore'
import { monthLifecycleStore } from '../monthLifecycle'
import { projectCommitments } from '../projection.js'
import styles from './CashFlowProjection.module.css'

type HorizonMonths = 3 | 6 | 12

type CostTypeFilter = 'company' | 'personal' | 'all'
type CommitmentFormType = 'fixed' | 'installment'
type HistoryFilter = CommitmentAuditAction | 'all'
type HistoryPeriodFilter = 'all' | '7d' | '30d' | '90d'

interface CommitmentFormState {
  description: string
  amount: string
  costType: CommitmentCostType
  startMonth: string
  endMonth: string
  totalInstallments: string
  currentInstallment: string
  notes: string
}

interface CommitmentValidationErrors {
  description?: string
  amount?: string
  startMonth?: string
  endMonth?: string
  totalInstallments?: string
  currentInstallment?: string
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

function formatAmountFromNumber(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function nextCommitmentId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `commitment-${Date.now()}`
}

function formatMonthLabel(month: string) {
  const [yearRaw, monthRaw] = month.split('-')
  const date = new Date(Number(yearRaw), Number(monthRaw) - 1, 1)

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
  }).format(date)
}

function formatDateTimeLabel(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function toCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function filterHistoryByPeriod<T extends { at: string }>(entries: T[], period: HistoryPeriodFilter) {
  if (period === 'all') {
    return entries
  }

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const threshold = Date.now() - periodDays * 24 * 60 * 60 * 1000

  return entries.filter((entry) => new Date(entry.at).getTime() >= threshold)
}

export default function CashFlowProjection() {
  const monthContext = getMonthContext()
  const [horizonMonths, setHorizonMonths] = useState<HorizonMonths>(6)
  const [costType, setCostType] = useState<CostTypeFilter>('all')
  const [formType, setFormType] = useState<CommitmentFormType>('fixed')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<HistoryPeriodFilter>('all')
  const [refreshToken, setRefreshToken] = useState(0)
  const [editingCommitmentId, setEditingCommitmentId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success')
  const [formErrors, setFormErrors] = useState<CommitmentValidationErrors>({})
  const [form, setForm] = useState<CommitmentFormState>({
    description: '',
    amount: '',
    costType: 'company',
    startMonth: monthContext.month,
    endMonth: '',
    totalInstallments: '',
    currentInstallment: '1',
    notes: '',
  })

  function refreshCommitments() {
    setRefreshToken((current) => current + 1)
  }

  function clearForm(nextType: CommitmentFormType = formType) {
    setFormErrors({})
    setEditingCommitmentId(null)
    setForm({
      description: '',
      amount: '',
      costType: 'company',
      startMonth: monthContext.month,
      endMonth: '',
      totalInstallments: '',
      currentInstallment: '1',
      notes: '',
    })
    setFormType(nextType)
  }

  function showSuccess(message: string) {
    setStatusKind('success')
    setStatusMessage(message)
  }

  function showError(message: string) {
    setStatusKind('error')
    setStatusMessage(message)
  }

  function isCommitmentLocked(item: StoredCommitment) {
    return monthLifecycleStore.isMonthClosed({
      companyId: item.companyId,
      month: item.startMonth,
    })
  }

  function beginEditCommitment(item: StoredCommitment) {
    setEditingCommitmentId(item.id)
    setFormType(item.type)
    setFormErrors({})
    setForm({
      description: item.description,
      amount: formatAmountFromNumber(item.amount),
      costType: item.costType,
      startMonth: item.startMonth,
      endMonth: item.endMonth ?? '',
      totalInstallments: item.totalInstallments ? String(item.totalInstallments) : '',
      currentInstallment: item.currentInstallment ? String(item.currentInstallment) : '1',
      notes: item.notes ?? '',
    })
  }

  function validateCommitmentForm(state: CommitmentFormState, type: CommitmentFormType) {
    const errors: CommitmentValidationErrors = {}

    if (!state.description.trim()) {
      errors.description = 'Informe uma descrição curta.'
    }

    const amount = parseBrazilianAmount(state.amount)
    if (!state.amount.trim() || Number.isNaN(amount) || amount <= 0) {
      errors.amount = 'Informe um valor maior que zero.'
    }

    if (!/^\d{4}-\d{2}$/.test(state.startMonth)) {
      errors.startMonth = 'Use o formato YYYY-MM.'
    }

    if (type === 'fixed' && state.endMonth.trim()) {
      if (!/^\d{4}-\d{2}$/.test(state.endMonth)) {
        errors.endMonth = 'Use o formato YYYY-MM.'
      } else if (state.endMonth < state.startMonth) {
        errors.endMonth = 'Fim deve ser igual ou posterior ao início.'
      }
    }

    if (type === 'installment') {
      const totalInstallments = Number(state.totalInstallments)
      const currentInstallment = Number(state.currentInstallment)

      if (!Number.isInteger(totalInstallments) || totalInstallments <= 0) {
        errors.totalInstallments = 'Informe um total de parcelas válido.'
      }

      if (!Number.isInteger(currentInstallment) || currentInstallment <= 0) {
        errors.currentInstallment = 'Informe a parcela atual válida.'
      } else if (Number.isInteger(totalInstallments) && currentInstallment > totalInstallments) {
        errors.currentInstallment = 'Parcela atual não pode ser maior que o total.'
      }
    }

    return errors
  }

  function submitCommitment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateCommitmentForm(form, formType)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      if (editingCommitmentId) {
        updateCommitment(editingCommitmentId, {
          description: form.description.trim(),
          amount: parseBrazilianAmount(form.amount),
          type: formType,
          costType: form.costType,
          startMonth: form.startMonth,
          endMonth: formType === 'fixed' && form.endMonth.trim() ? form.endMonth : null,
          totalInstallments: formType === 'installment' ? Number(form.totalInstallments) : null,
          currentInstallment: formType === 'installment' ? Number(form.currentInstallment) : null,
          notes: form.notes.trim() || null,
        })
        showSuccess('Compromisso atualizado com sucesso.')
      } else {
        saveCommitment({
          id: nextCommitmentId(),
          companyId: monthContext.companyId,
          description: form.description.trim(),
          amount: parseBrazilianAmount(form.amount),
          type: formType,
          costType: form.costType,
          startMonth: form.startMonth,
          endMonth: formType === 'fixed' && form.endMonth.trim() ? form.endMonth : null,
          totalInstallments: formType === 'installment' ? Number(form.totalInstallments) : null,
          currentInstallment: formType === 'installment' ? Number(form.currentInstallment) : null,
          categoryId: null,
          notes: form.notes.trim() || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        showSuccess('Compromisso salvo com sucesso.')
      }

      refreshCommitments()
      clearForm(formType)
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Nao foi possivel salvar o compromisso.')
    }
  }

  function deleteCommitment(commitmentId: string) {
    try {
      removeCommitment(commitmentId)
      refreshCommitments()
      showSuccess('Compromisso removido da projecao.')
      if (editingCommitmentId === commitmentId) {
        clearForm(formType)
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Nao foi possivel remover o compromisso.')
    }
  }

  function advanceCommitmentInstallment(commitmentId: string) {
    try {
      const updated = advanceInstallment(commitmentId)
      refreshCommitments()
      if (updated.currentInstallment && updated.totalInstallments && updated.currentInstallment > updated.totalInstallments) {
        showSuccess('Parcelamento concluido.')
      } else {
        showSuccess('Parcela avancada com sucesso.')
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Nao foi possivel avancar a parcela.')
    }
  }

  function exportHistoryCsv() {
    const header = ['data_hora', 'acao', 'resumo', 'compromisso_id']
    const lines = [
      header.map((value) => toCsvValue(value)).join(','),
      ...auditEntriesForExport.map((entry) =>
        [entry.at, entry.action, entry.summary, entry.commitmentId]
          .map((value) => toCsvValue(String(value)))
          .join(',')
      ),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `historico-compromissos-${monthContext.month}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const commitments = useMemo(
    () =>
      listCommitments({
        companyId: monthContext.companyId,
        costType,
      }),
    [monthContext.companyId, costType, refreshToken]
  )

  const projection = useMemo(
    () =>
      projectCommitments({
        referenceMonth: monthContext.month,
        horizonMonths,
        commitments,
        companyId: monthContext.companyId,
        costType,
      }),
    [monthContext.companyId, monthContext.month, horizonMonths, commitments, costType]
  )

  const hasCommitments = commitments.length > 0
  const auditEntriesRaw = useMemo(
    () =>
      listCommitmentHistory({
        companyId: monthContext.companyId,
        action: historyFilter,
      }),
    [monthContext.companyId, historyFilter, refreshToken]
  )
  const auditEntriesForExport = useMemo(
    () => filterHistoryByPeriod(auditEntriesRaw, historyPeriodFilter),
    [auditEntriesRaw, historyPeriodFilter]
  )
  const auditEntries = useMemo(() => auditEntriesForExport.slice(0, 8), [auditEntriesForExport])

  return (
    <ScreenContainer title="Projeção de Fluxo de Caixa">
      <div className={styles.controlsCardWrap}>
        <Card className={styles.controlsCard}>
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Horizonte</span>
              <div className={styles.horizonButtons} role="group" aria-label="Horizonte de projeção">
                {[3, 6, 12].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`${styles.horizonButton} ${horizonMonths === option ? styles.active : ''}`}
                    onClick={() => setHorizonMonths(option as HorizonMonths)}
                    aria-pressed={horizonMonths === option}
                  >
                    {option} meses
                  </button>
                ))}
              </div>
            </div>

            <label htmlFor="projection-cost-type" className={styles.controlGroup}>
              <span className={styles.controlLabel}>Tipo de custo</span>
              <select
                id="projection-cost-type"
                className={styles.selectControl}
                value={costType}
                onChange={(event) => setCostType(event.target.value as CostTypeFilter)}
              >
                <option value="all">Todos</option>
                <option value="company">Empresa</option>
                <option value="personal">Pessoal</option>
              </select>
            </label>
          </div>
        </Card>
      </div>

      <Card className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.sectionTitle}>{editingCommitmentId ? 'Editar compromisso' : 'Cadastrar compromisso'}</h2>
          <div className={styles.formTypeButtons}>
            <button
              type="button"
              className={`${styles.formTypeButton} ${formType === 'fixed' ? styles.active : ''}`}
              onClick={() => clearForm('fixed')}
            >
              Conta fixa
            </button>
            <button
              type="button"
              className={`${styles.formTypeButton} ${formType === 'installment' ? styles.active : ''}`}
              onClick={() => clearForm('installment')}
            >
              Parcelamento
            </button>
          </div>
        </div>

        <form className={styles.formGrid} onSubmit={submitCommitment}>
          <label className={styles.field} htmlFor="commitment-description">
            <span>Descrição</span>
            <input
              id="commitment-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder={formType === 'fixed' ? 'Ex.: Aluguel' : 'Ex.: Notebook 10x'}
            />
            {formErrors.description ? <small className={styles.errorText}>{formErrors.description}</small> : null}
          </label>

          <label className={styles.field} htmlFor="commitment-amount">
            <span>Valor</span>
            <input
              id="commitment-amount"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  amount: formatAmountInput(event.target.value),
                }))
              }
              placeholder="0,00"
            />
            {formErrors.amount ? <small className={styles.errorText}>{formErrors.amount}</small> : null}
          </label>

          <label className={styles.field} htmlFor="commitment-cost-type">
            <span>Tipo</span>
            <select
              id="commitment-cost-type"
              value={form.costType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  costType: event.target.value as CommitmentCostType,
                }))
              }
            >
              <option value="company">Empresa</option>
              <option value="personal">Pessoal</option>
            </select>
          </label>

          <label className={styles.field} htmlFor="commitment-start-month">
            <span>Início (YYYY-MM)</span>
            <input
              id="commitment-start-month"
              value={form.startMonth}
              onChange={(event) => setForm((current) => ({ ...current, startMonth: event.target.value }))}
              placeholder="2026-05"
            />
            {formErrors.startMonth ? <small className={styles.errorText}>{formErrors.startMonth}</small> : null}
          </label>

          {formType === 'fixed' ? (
            <label className={styles.field} htmlFor="commitment-end-month">
              <span>Fim (opcional, YYYY-MM)</span>
              <input
                id="commitment-end-month"
                value={form.endMonth}
                onChange={(event) => setForm((current) => ({ ...current, endMonth: event.target.value }))}
                placeholder="2026-12"
              />
              {formErrors.endMonth ? <small className={styles.errorText}>{formErrors.endMonth}</small> : null}
            </label>
          ) : (
            <>
              <label className={styles.field} htmlFor="commitment-total-installments">
                <span>Total de parcelas</span>
                <input
                  id="commitment-total-installments"
                  inputMode="numeric"
                  value={form.totalInstallments}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      totalInstallments: event.target.value.replace(/\D/g, ''),
                    }))
                  }
                  placeholder="10"
                />
                {formErrors.totalInstallments ? (
                  <small className={styles.errorText}>{formErrors.totalInstallments}</small>
                ) : null}
              </label>

              <label className={styles.field} htmlFor="commitment-current-installment">
                <span>Parcela atual</span>
                <input
                  id="commitment-current-installment"
                  inputMode="numeric"
                  value={form.currentInstallment}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currentInstallment: event.target.value.replace(/\D/g, ''),
                    }))
                  }
                  placeholder="1"
                />
                {formErrors.currentInstallment ? (
                  <small className={styles.errorText}>{formErrors.currentInstallment}</small>
                ) : null}
              </label>
            </>
          )}

          <label className={`${styles.field} ${styles.fullWidth}`} htmlFor="commitment-notes">
            <span>Observação (opcional)</span>
            <input
              id="commitment-notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Informações adicionais"
            />
          </label>

          <div className={styles.formActions}>
            {editingCommitmentId ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => clearForm(formType)}>
                Cancelar edicao
              </Button>
            ) : null}
            <Button type="submit" size="sm">
              {editingCommitmentId ? 'Atualizar compromisso' : 'Salvar compromisso'}
            </Button>
          </div>
        </form>

        {statusMessage ? (
          <p className={statusKind === 'error' ? styles.statusMessageError : styles.statusMessage}>{statusMessage}</p>
        ) : null}
      </Card>

      <div className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Próximo mês</span>
          <strong className={styles.summaryValue}>{formatCurrency(projection.summary.nextMonth)}</strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Próximos 3 meses</span>
          <strong className={styles.summaryValue}>{formatCurrency(projection.summary.nextThreeMonths)}</strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Próximos 12 meses</span>
          <strong className={styles.summaryValue}>{formatCurrency(projection.summary.nextTwelveMonths)}</strong>
        </Card>
      </div>

      <Card className={styles.peakCard}>
        <div className={styles.peakHeader}>
          <h2 className={styles.sectionTitle}>Pico de comprometimento</h2>
          {projection.summary.peakMonth ? (
            <span className={styles.peakBadge}>{formatMonthLabel(projection.summary.peakMonth.month)}</span>
          ) : null}
        </div>
        <p className={styles.peakText}>
          {projection.summary.peakMonth
            ? `${formatCurrency(projection.summary.peakMonth.total)} previstos no mês de maior carga.`
            : 'Sem valores projetados para o horizonte selecionado.'}
        </p>
      </Card>

      <Card>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>Previsão mensal</h2>
          <span className={styles.contextText}>
            Empresa: {monthContext.companyId} · Referência: {formatMonthLabel(monthContext.month)}
          </span>
        </div>

        {hasCommitments ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Fixas</th>
                  <th>Parceladas</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {projection.rows.map((row) => {
                  const isPeak = projection.summary.peakMonth?.month === row.month
                  return (
                    <tr key={row.month} className={isPeak ? styles.peakRow : ''}>
                      <td>{formatMonthLabel(row.month)}</td>
                      <td>{formatCurrency(row.fixed)}</td>
                      <td>{formatCurrency(row.installment)}</td>
                      <td className={styles.totalCell}>{formatCurrency(row.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyState}>
            Nenhum compromisso futuro cadastrado. Adicione contas fixas e parcelamentos para visualizar a projeção.
          </p>
        )}
      </Card>

      <Card className={styles.commitmentsCard}>
        <h2 className={styles.sectionTitle}>Compromissos cadastrados</h2>
        {hasCommitments ? (
          <ul className={styles.commitmentsList}>
            {commitments.map((item) => (
              <li key={item.id} className={styles.commitmentRow}>
                <div>
                  <strong className={styles.commitmentName}>{item.description}</strong>
                  <p className={styles.commitmentMeta}>
                    {item.type === 'fixed'
                      ? `Fixa · ${item.costType === 'company' ? 'Empresa' : 'Pessoal'}`
                      : `Parcelada ${item.currentInstallment}/${item.totalInstallments} · ${
                          item.costType === 'company' ? 'Empresa' : 'Pessoal'
                        }`}
                  </p>
                  {isCommitmentLocked(item) ? <p className={styles.lockedMeta}>Mes fechado: edicao bloqueada.</p> : null}
                </div>
                <div className={styles.commitmentActions}>
                  <strong>{formatCurrency(item.amount)}</strong>
                  <div className={styles.commitmentActionButtons}>
                    {item.type === 'installment' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => advanceCommitmentInstallment(item.id)}
                        disabled={isCommitmentLocked(item) || Number(item.currentInstallment ?? 0) > Number(item.totalInstallments ?? 0)}
                      >
                        Avancar parcela
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => beginEditCommitment(item)} disabled={isCommitmentLocked(item)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteCommitment(item.id)} disabled={isCommitmentLocked(item)}>
                      Remover
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>Sem compromissos cadastrados para este filtro.</p>
        )}
      </Card>

      <Card className={styles.auditCard}>
        <div className={styles.auditHeader}>
          <h2 className={styles.sectionTitle}>Historico de alteracoes</h2>
          <div className={styles.auditControls}>
            <label htmlFor="audit-filter" className={styles.auditFilterLabel}>
              <span>Evento</span>
              <select
                id="audit-filter"
                className={styles.auditFilterSelect}
                value={historyFilter}
                onChange={(event) => setHistoryFilter(event.target.value as HistoryFilter)}
              >
                <option value="all">Todos</option>
                <option value="created">Criados</option>
                <option value="updated">Editados</option>
                <option value="installment_advanced">Parcela avançada</option>
                <option value="removed">Removidos</option>
              </select>
            </label>
            <label htmlFor="audit-period-filter" className={styles.auditFilterLabel}>
              <span>Período</span>
              <select
                id="audit-period-filter"
                className={styles.auditFilterSelect}
                value={historyPeriodFilter}
                onChange={(event) => setHistoryPeriodFilter(event.target.value as HistoryPeriodFilter)}
              >
                <option value="all">Todo período</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </label>
            <Button size="sm" variant="outline" onClick={exportHistoryCsv} disabled={auditEntriesForExport.length === 0}>
              Exportar CSV
            </Button>
          </div>
        </div>
        {auditEntries.length > 0 ? (
          <ul className={styles.auditList}>
            {auditEntries.map((entry) => (
              <li key={entry.id} className={styles.auditRow}>
                <p className={styles.auditSummary}>{entry.summary}</p>
                <span className={styles.auditMeta}>{formatDateTimeLabel(entry.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>Sem alteracoes registradas ainda.</p>
        )}
      </Card>
    </ScreenContainer>
  )
}
