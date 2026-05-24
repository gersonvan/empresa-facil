import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ScreenContainer from '../components/ScreenContainer'
import { createLaunchEntry } from '../domain'
import { toIngestionRecord } from '../contracts'
import { listCategories, type CostType, type DreGroup } from '../categoryStore'
import { monthLifecycleStore } from '../monthLifecycle'
import { saveLaunchEntry } from '../launchStore'
import { Button, Card, Input } from '../components/ui'
import styles from './Launch.module.css'

interface LaunchFormState {
  costType: CostType
  dreGroup: DreGroup
  categoryId: string
  description: string
  amount: string
  notes: string
}

interface ValidationErrors {
  categoryId?: string
  description?: string
  amount?: string
}

const DEFAULT_COMPANY_ID = 'company-main'

function monthFromNow() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function parseBrazilianAmount(rawValue: string) {
  return Number(rawValue.replace(',', '.'))
}

function nextEntryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `launch-${Date.now()}`
}

export default function Launch() {
  const [searchParams] = useSearchParams()
  const initialIntent = searchParams.get('intent') === 'personal' ? 'personal' : 'company'

  const [form, setForm] = useState<LaunchFormState>({
    costType: initialIntent,
    dreGroup: 'expenses',
    categoryId: '',
    description: '',
    amount: '',
    notes: '',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const currentMonth = useMemo(() => monthFromNow(), [])

  const availableCategories = useMemo(
    () =>
      listCategories({
        costType: form.costType,
        dreGroup: form.dreGroup,
      }),
    [form.costType, form.dreGroup]
  )

  function validate(nextState: LaunchFormState) {
    const validationErrors: ValidationErrors = {}

    if (!nextState.categoryId) {
      validationErrors.categoryId = 'Escolha uma categoria para classificar o lançamento.'
    }

    if (!nextState.description.trim()) {
      validationErrors.description = 'Informe uma descrição curta.'
    }

    const parsedAmount = parseBrazilianAmount(nextState.amount)
    if (!nextState.amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      validationErrors.amount = 'Informe um valor maior que zero.'
    }

    return validationErrors
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (monthLifecycleStore.isMonthClosed({ companyId: DEFAULT_COMPANY_ID, month: currentMonth })) {
      setStatusMessage('Este mês está fechado. Reabra em Revisão do Mês para incluir ou editar lançamentos.')
      return
    }

    const selectedCategory = availableCategories.find((category) => category.id === form.categoryId)
    if (!selectedCategory) {
      setErrors((currentErrors) => ({ ...currentErrors, categoryId: 'Categoria inválida para este tipo/natureza.' }))
      return
    }

    const entry = createLaunchEntry({
      id: nextEntryId(),
      companyId: DEFAULT_COMPANY_ID,
      month: currentMonth,
      costType: form.costType,
      description: form.description,
      amount: parseBrazilianAmount(form.amount),
    })

    // Keep payload compatibility visible in UI for manual and import parity.
    const ingestionRecord = toIngestionRecord(entry)
    saveLaunchEntry({
      ...entry,
      dreGroup: form.dreGroup,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      createdAt: new Date().toISOString(),
    })
    setSavedEntryId(String(ingestionRecord.source_id))
    setStatusMessage('')

    setForm((prevState) => ({
      ...prevState,
      categoryId: '',
      description: '',
      amount: '',
      notes: '',
    }))
  }

  function updateCostType(nextCostType: CostType) {
    setForm((prevState) => ({
      ...prevState,
      costType: nextCostType,
      categoryId: '',
    }))
  }

  function updateDreGroup(nextDreGroup: DreGroup) {
    setForm((prevState) => ({
      ...prevState,
      dreGroup: nextDreGroup,
      categoryId: '',
    }))
  }

  return (
    <ScreenContainer title="Lançar">
      <Card className={styles.formCard}>
        <form className={styles.formGrid} onSubmit={submitForm}>
          <section className={styles.step} aria-label="Passo 1 de 3">
            <h2 className={styles.stepTitle}>1. Para quem é este lançamento?</h2>
            <p className={styles.stepHint}>Escolha apenas uma intenção para manter o cadastro rápido.</p>
            <div className={styles.intentOptions} role="group" aria-label="Tipo de lançamento">
              <button
                type="button"
                className={`${styles.intentButton} ${form.costType === 'company' ? styles.intentActive : ''}`}
                onClick={() => updateCostType('company')}
                aria-pressed={form.costType === 'company'}
              >
                Empresa
              </button>
              <button
                type="button"
                className={`${styles.intentButton} ${form.costType === 'personal' ? styles.intentActive : ''}`}
                onClick={() => updateCostType('personal')}
                aria-pressed={form.costType === 'personal'}
              >
                Pessoal
              </button>
            </div>
          </section>

          <section className={styles.step} aria-label="Passo 2 de 3">
            <h2 className={styles.stepTitle}>2. Natureza, categoria e valor</h2>
            <div className={styles.fields}>
              <div className={styles.intentOptions} role="group" aria-label="Natureza DRE">
                <button
                  type="button"
                  className={`${styles.intentButton} ${form.dreGroup === 'revenue' ? styles.intentActive : ''}`}
                  onClick={() => updateDreGroup('revenue')}
                  aria-pressed={form.dreGroup === 'revenue'}
                >
                  Receita
                </button>
                <button
                  type="button"
                  className={`${styles.intentButton} ${form.dreGroup === 'expenses' ? styles.intentActive : ''}`}
                  onClick={() => updateDreGroup('expenses')}
                  aria-pressed={form.dreGroup === 'expenses'}
                >
                  Despesa
                </button>
              </div>

              <label className={styles.selectField} htmlFor="launch-category">
                <span>Categoria</span>
                <select
                  id="launch-category"
                  value={form.categoryId}
                  onChange={(event) => setForm((prevState) => ({ ...prevState, categoryId: event.target.value }))}
                  className={errors.categoryId ? styles.selectError : ''}
                >
                  <option value="">Selecione...</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId ? <span className={styles.selectErrorText}>{errors.categoryId}</span> : null}
              </label>

              <Input
                label="Descrição"
                placeholder={form.dreGroup === 'revenue' ? 'Ex.: venda balcão' : 'Ex.: aluguel do escritorio'}
                helperText="Use um nome curto e direto."
                value={form.description}
                onChange={(event) => setForm((prevState) => ({ ...prevState, description: event.target.value }))}
                errorText={errors.description}
              />
              <Input
                label="Valor"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={(event) => setForm((prevState) => ({ ...prevState, amount: event.target.value }))}
                errorText={errors.amount}
              />
              <details className={styles.optionalDetails}>
                <summary className={styles.optionalSummary}>Campos opcionais (deixar para depois)</summary>
                <div className={styles.optionalContent}>
                  <Input
                    label="Observação"
                    placeholder="Ex.: ajustar centro de custo depois"
                    value={form.notes}
                    onChange={(event) => setForm((prevState) => ({ ...prevState, notes: event.target.value }))}
                  />
                </div>
              </details>
            </div>
          </section>

          <section className={styles.step} aria-label="Passo 3 de 3">
            <h2 className={styles.stepTitle}>3. Confirmar e salvar</h2>
            <p className={styles.stepHint}>
              Empresa padrão: <strong>{DEFAULT_COMPANY_ID}</strong> · Mês: <strong>{currentMonth}</strong>
            </p>
            <Button type="submit" variant="primary" fullWidth>
              Salvar lançamento
            </Button>
            {savedEntryId ? (
              <p className={styles.successMessage} role="status">
                Lançamento salvo com sucesso. ID: {savedEntryId}
              </p>
            ) : null}
            {statusMessage ? (
              <p className={styles.protectionMessage} role="status">
                {statusMessage}
              </p>
            ) : null}
          </section>
        </form>
      </Card>
    </ScreenContainer>
  )
}
