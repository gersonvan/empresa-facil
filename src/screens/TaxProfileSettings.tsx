import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Button, Card, Input } from '../components/ui'
import { listDeductionBrackets, matchDeductionBracket } from '../deductionBracketStore'
import { recomputeAutomaticDeductions } from '../launchStore'
import { getMonthContext } from './financialOverview'
import { getTaxProfile, upsertTaxProfile } from '../taxProfileStore'
import styles from './TaxProfileSettings.module.css'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function toForecastInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }

  return String(Math.round(value))
}

export default function TaxProfileSettings() {
  const monthContext = getMonthContext()
  const [refreshToken, setRefreshToken] = useState(0)
  const [message, setMessage] = useState('')

  const profile = useMemo(() => getTaxProfile(monthContext.companyId), [monthContext.companyId, refreshToken])
  const [annualRevenueForecast, setAnnualRevenueForecast] = useState(() =>
    toForecastInput(profile?.annualRevenueForecast ?? 0)
  )

  const parsedForecast = Number(annualRevenueForecast)
  const hasValidForecast = Number.isFinite(parsedForecast) && parsedForecast > 0

  const matchedBracket = hasValidForecast ? matchDeductionBracket(parsedForecast) : null
  const brackets = useMemo(() => listDeductionBrackets(), [refreshToken])

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasValidForecast) {
      setMessage('Informe uma previsão anual maior que zero para ativar deduções automáticas.')
      return
    }

    try {
      upsertTaxProfile({
        companyId: monthContext.companyId,
        annualRevenueForecast: parsedForecast,
      })
      recomputeAutomaticDeductions({ companyId: monthContext.companyId })
      setRefreshToken((current) => current + 1)
      setMessage('Perfil tributário salvo. Deduções automáticas recalculadas para receitas já lançadas.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar o perfil tributário.')
    }
  }

  function resetToCurrentProfile() {
    setAnnualRevenueForecast(toForecastInput(profile?.annualRevenueForecast ?? 0))
    setMessage('')
  }

  return (
    <ScreenContainer title="Configuração tributária">
      <Card className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Perfil por empresa ativa</h2>
        <p className={styles.helper}>
          Empresa ativa: <strong>{monthContext.companyId}</strong>. Este valor define a faixa usada para gerar deduções
          estimadas automaticamente em novas receitas empresariais.
        </p>

        {message ? <p className={styles.message}>{message}</p> : null}

        <form className={styles.formGrid} onSubmit={saveProfile}>
          <Input
            label="Previsão anual de receita (R$)"
            inputMode="numeric"
            placeholder="Ex.: 240000"
            value={annualRevenueForecast}
            onChange={(event) => setAnnualRevenueForecast(event.target.value.replace(/\D/g, ''))}
            helperText="Use o total anual estimado da receita da empresa."
          />

          <div className={styles.previewCard}>
            <p className={styles.previewTitle}>Faixa aplicada</p>
            {matchedBracket ? (
              <p className={styles.previewText}>
                De {formatCurrency(matchedBracket.minAnnualRevenue)} até {formatCurrency(matchedBracket.maxAnnualRevenue)}
                {' · '}
                <strong>{matchedBracket.estimatedDeductionRate.toFixed(2).replace('.', ',')}%</strong>
              </p>
            ) : (
              <p className={styles.previewText}>Sem faixa ativa para esta previsão. Ajuste a previsão para gerar dedução.</p>
            )}
          </div>

          <div className={styles.formActions}>
            <Button size="sm" type="submit">
              Salvar e recalcular deduções
            </Button>
            <Button size="sm" variant="outline" onClick={resetToCurrentProfile}>
              Desfazer alterações
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Faixas de dedução estimada</h2>
        <p className={styles.helper}>As faixas abaixo são usadas para estimar deduções sobre receitas empresariais.</p>
        <ul className={styles.list}>
          {brackets.map((bracket) => (
            <li key={bracket.id} className={styles.row}>
              <p className={styles.rowTitle}>
                {formatCurrency(bracket.minAnnualRevenue)} até {formatCurrency(bracket.maxAnnualRevenue)}
              </p>
              <p className={styles.rowMeta}>
                Alíquota estimada: {bracket.estimatedDeductionRate.toFixed(2).replace('.', ',')}%{' '}
                {bracket.isActive ? '(ativa)' : '(inativa)'}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </ScreenContainer>
  )
}
