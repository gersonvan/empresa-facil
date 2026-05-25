import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { listCategories } from '../categoryStore'
import { createLaunchEntry } from '../domain'
import { listLaunchEntries, saveLaunchEntry } from '../launchStore'
import { MONTH_STATUS_VALUES } from '../domain'
import { monthLifecycleStore } from '../monthLifecycle'
import { getDeductionReconciliation, saveDeductionReconciliation } from '../reconciliationStore'
import { formatCurrency, formatPercent, getMonthContext, getMonthlyOverview } from './financialOverview'
import styles from './MonthReview.module.css'

type MonthStatus = (typeof MONTH_STATUS_VALUES)[number]

const statusLabel: Record<MonthStatus, string> = {
  open: 'Aberto',
  in_review: 'Em revisão',
  closed: 'Fechado',
}

export default function MonthReview() {
  const month = getMonthContext()
  const overview = getMonthlyOverview()
  const [statusState, setStatusState] = useState(() =>
    monthLifecycleStore.getStatus({ companyId: month.companyId, month: month.month })
  )
  const [message, setMessage] = useState('')
  const [actualDeductionsInput, setActualDeductionsInput] = useState('')
  const status = statusState.status as MonthStatus

  const nextActions = useMemo(() => {
    if (status === 'open') {
      return [{ key: 'in_review', label: 'Enviar para revisão' }]
    }

    if (status === 'in_review') {
      return [
        { key: 'open', label: 'Reabrir mês' },
        { key: 'closed', label: 'Fechar mês' },
      ]
    }

    return [{ key: 'reopen_closed', label: 'Reabrir para revisão' }]
  }, [status])

  const deductionEntries = useMemo(
    () =>
      listLaunchEntries({ companyId: month.companyId, month: month.month, costType: 'company' }).filter(
        (entry) => entry.sourceType === 'tax_estimation' && entry.dreGroup === 'deductions' && entry.reviewStatus !== 'rejected'
      ),
    [month.companyId, month.month]
  )

  const estimatedTotalDeductions = useMemo(
    () => deductionEntries.reduce((acc, entry) => acc + entry.amount, 0),
    [deductionEntries]
  )

  const persistedReconciliation = useMemo(
    () => getDeductionReconciliation(month.companyId, month.month),
    [month.companyId, month.month, estimatedTotalDeductions]
  )

  const actualTotalDeductions = useMemo(() => {
    const parsed = Number(actualDeductionsInput.replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }

    if (persistedReconciliation) {
      return persistedReconciliation.actualTotalDeductions
    }

    return 0
  }, [actualDeductionsInput, persistedReconciliation])

  const adjustmentValue = Number((actualTotalDeductions - estimatedTotalDeductions).toFixed(2))

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

  function nextEntryId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    return `launch-${Date.now()}`
  }

  function applyReconciliation() {
    if (monthLifecycleStore.isMonthClosed({ companyId: month.companyId, month: month.month })) {
      setMessage('Mês fechado: não é possível aplicar ajuste de reconciliação.')
      return
    }

    if (Math.abs(adjustmentValue) < 0.01) {
      saveDeductionReconciliation({
        companyId: month.companyId,
        month: month.month,
        estimatedTotalDeductions,
        actualTotalDeductions,
        adjustmentValue,
        status: 'reconciled',
        reviewedBy: 'owner',
        notes: 'Reconciliação sem diferença de ajuste.',
      })
      setMessage('Reconciliação concluída sem necessidade de ajuste.')
      return
    }

    const taxDeductionCategory = listCategories({ costType: 'company', dreGroup: 'deductions' }).find(
      (category) => category.id === 'cat-company-deduction-taxes-sales'
    )
    const fallbackDeductionCategory =
      taxDeductionCategory ?? listCategories({ costType: 'company', dreGroup: 'deductions' })[0]
    const fallbackRevenueCategory = listCategories({ costType: 'company', dreGroup: 'revenue' })[0]

    if (!fallbackDeductionCategory || !fallbackRevenueCategory) {
      setMessage('Não foi possível localizar categorias para lançar o ajuste de reconciliação.')
      return
    }

    const nowIso = new Date().toISOString()
    const baseDescription = 'Ajuste de reconciliação de deduções previstas'

    if (adjustmentValue > 0) {
      const entry = createLaunchEntry({
        id: nextEntryId(),
        companyId: month.companyId,
        month: month.month,
        costType: 'company',
        description: `${baseDescription} (complemento)`,
        amount: adjustmentValue,
      })

      saveLaunchEntry({
        ...entry,
        dreGroup: 'deductions',
        categoryId: fallbackDeductionCategory.id,
        categoryName: fallbackDeductionCategory.name,
        createdAt: nowIso,
        sourceType: 'manual',
        autoGenerated: false,
        reviewStatus: 'approved',
      })
    } else {
      const entry = createLaunchEntry({
        id: nextEntryId(),
        companyId: month.companyId,
        month: month.month,
        costType: 'company',
        description: `${baseDescription} (reversão)` ,
        amount: Math.abs(adjustmentValue),
      })

      saveLaunchEntry({
        ...entry,
        dreGroup: 'revenue',
        categoryId: fallbackRevenueCategory.id,
        categoryName: fallbackRevenueCategory.name,
        createdAt: nowIso,
        sourceType: 'manual',
        autoGenerated: false,
        reviewStatus: 'approved',
      })
    }

    saveDeductionReconciliation({
      companyId: month.companyId,
      month: month.month,
      estimatedTotalDeductions,
      actualTotalDeductions,
      adjustmentValue,
      status: 'reconciled',
      reviewedBy: 'owner',
      notes:
        adjustmentValue > 0
          ? 'Ajuste de complemento de dedução registrado automaticamente.'
          : 'Ajuste de reversão de dedução registrado automaticamente.',
    })

    setMessage('Reconciliação aplicada e ajuste registrado no mês.')
  }

  function refreshStatus(nextState: ReturnType<typeof monthLifecycleStore.getStatus>) {
    setStatusState(nextState)
  }

  function applyStatus(nextAction: string) {
    try {
      if (nextAction === 'in_review') {
        const nextState = monthLifecycleStore.sendToReview({
          companyId: month.companyId,
          month: month.month,
          actorRole: 'owner',
        })
        refreshStatus(nextState)
        setMessage(`Status atualizado para ${statusLabel.in_review}.`)
        return
      }

      if (nextAction === 'open') {
        const nextState = monthLifecycleStore.moveBackToOpen({
          companyId: month.companyId,
          month: month.month,
          actorRole: 'owner',
        })
        refreshStatus(nextState)
        setMessage(`Status atualizado para ${statusLabel.open}.`)
        return
      }

      if (nextAction === 'closed') {
        const nextState = monthLifecycleStore.approveAndClose({
          companyId: month.companyId,
          month: month.month,
          approverRole: 'owner',
        })
        refreshStatus(nextState)
        setMessage('Mês fechado com aprovação do Dono e protegido contra edições.')
        return
      }

      if (nextAction === 'reopen_closed') {
        const nextState = monthLifecycleStore.reopenClosedMonth({
          companyId: month.companyId,
          month: month.month,
          actorRole: 'owner',
        })
        refreshStatus(nextState)
        setMessage('Mês reaberto para revisão. Histórico de fechamento foi preservado.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar o status.')
    }
  }

  return (
    <ScreenContainer title="Revisão do Mês">
      <div className={styles.grid}>
        <Card>
          <h2 className={styles.sectionTitle}>Status do fechamento</h2>
          <p className={styles.meta}>Empresa: {month.companyName}</p>
          <p className={styles.meta}>Mês: {month.month}</p>
          <p className={styles.currentStatus}>Atual: {statusLabel[status]}</p>
          {statusState.hasBeenClosed && statusState.closedAt ? (
            <p className={styles.auditNote}>
              Fechamento anterior registrado em {new Date(statusState.closedAt).toLocaleString('pt-BR')}.
            </p>
          ) : null}

          <div className={styles.actionGroup}>
            {nextActions.map((action) => (
              <Button
                key={action.key}
                variant={action.key === 'closed' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => applyStatus(action.key)}
              >
                {action.label}
              </Button>
            ))}
          </div>

          {status === 'in_review' ? (
            <p className={styles.ownerHint}>Somente a ação Aprovar (Dono) conclui o fechamento do mês.</p>
          ) : null}

          {message ? (
            <p className={styles.message} role="status">
              {message}
            </p>
          ) : null}
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Checklist rápido</h2>
          <ul className={styles.checklist}>
            <li>Lançamentos do mês conferidos</li>
            <li>DRE revisado com indicadores</li>
            <li>Aviso de validação contábil registrado</li>
          </ul>
          <p className={styles.meta}>Regra fiscal: {overview.summary.taxRuleVersion}</p>
          <p className={styles.meta}>Rastreio: {overview.summary.taxDerivationFingerprint}</p>
          <p className={styles.meta}>Contexto do ciclo: {overview.taxSupport.audit.lifecycleSnapshot?.status ?? 'sem contexto'}</p>
          <p className={styles.warning}>{overview.summary.accountantValidationWarning}</p>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Resumo para decisão</h2>
          <div className={styles.kpiGrid}>
            <div>
              <span className={styles.kpiLabel}>Resultado</span>
              <strong className={styles.kpiValue}>{formatCurrency(overview.summary.operatingResult)}</strong>
            </div>
            <div>
              <span className={styles.kpiLabel}>Margem líquida</span>
              <strong className={styles.kpiValue}>{formatPercent(overview.indicators.netMarginPercent)}</strong>
            </div>
            <div>
              <span className={styles.kpiLabel}>Carga tributária</span>
              <strong className={styles.kpiValue}>{formatPercent(overview.indicators.taxBurdenPercent)}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Reconciliação de deduções</h2>
          <div className={styles.kpiGrid}>
            <div>
              <span className={styles.kpiLabel}>Total previsto</span>
              <strong className={styles.kpiValue}>{formatCurrency(estimatedTotalDeductions)}</strong>
            </div>
            <div>
              <span className={styles.kpiLabel}>Total real informado</span>
              <input
                className={styles.amountInput}
                type="text"
                inputMode="decimal"
                placeholder={persistedReconciliation ? 'Valor real salvo' : '0,00'}
                value={actualDeductionsInput}
                onChange={(event) => setActualDeductionsInput(formatAmountInput(event.target.value))}
              />
            </div>
            <div>
              <span className={styles.kpiLabel}>Diferença (real - previsto)</span>
              <strong className={styles.kpiValue}>{formatCurrency(adjustmentValue)}</strong>
            </div>
          </div>

          <div className={styles.actionGroup}>
            <Button size="sm" onClick={applyReconciliation}>
              Gerar ajuste de reconciliação
            </Button>
          </div>

          {persistedReconciliation ? (
            <p className={styles.meta}>
              Última reconciliação: {new Date(persistedReconciliation.reviewedAt).toLocaleString('pt-BR')} · status {persistedReconciliation.status}
            </p>
          ) : null}

          <p className={styles.ownerHint}>
            Se a diferença for negativa, o sistema registra uma reversão em receita para compensar excesso de dedução prevista.
          </p>
        </Card>
      </div>
    </ScreenContainer>
  )
}
