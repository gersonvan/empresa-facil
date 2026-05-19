import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { MONTH_STATUS_VALUES } from '../domain'
import { monthLifecycleStore } from '../monthLifecycle'
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
      </div>
    </ScreenContainer>
  )
}
