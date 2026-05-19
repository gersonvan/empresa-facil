import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { MONTH_STATUS_VALUES } from '../domain'
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
  const [status, setStatus] = useState<MonthStatus>('open')
  const [message, setMessage] = useState('')

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

    return [{ key: 'closed', label: 'Mês já fechado' }]
  }, [status])

  function applyStatus(nextStatus: MonthStatus) {
    if (status === 'closed') {
      setMessage('Este mês já está fechado e protegido contra edição.')
      return
    }

    setStatus(nextStatus)
    setMessage(`Status atualizado para ${statusLabel[nextStatus]}.`)
  }

  return (
    <ScreenContainer title="Revisão do Mês">
      <div className={styles.grid}>
        <Card>
          <h2 className={styles.sectionTitle}>Status do fechamento</h2>
          <p className={styles.meta}>Empresa: {month.companyName}</p>
          <p className={styles.meta}>Mês: {month.month}</p>
          <p className={styles.currentStatus}>Atual: {statusLabel[status]}</p>

          <div className={styles.actionGroup}>
            {nextActions.map((action) => (
              <Button
                key={action.key}
                variant={action.key === 'closed' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => applyStatus(action.key as MonthStatus)}
                disabled={status === 'closed'}
              >
                {action.label}
              </Button>
            ))}
          </div>

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
