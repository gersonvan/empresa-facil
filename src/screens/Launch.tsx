import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ScreenContainer from '../components/ScreenContainer'
import { createLaunchEntry } from '../domain'
import { toIngestionRecord } from '../contracts'
import { listCategories, type CostType, type DreGroup } from '../categoryStore'
import { monthLifecycleStore } from '../monthLifecycle'
import { listLaunchEntries, saveLaunchEntry } from '../launchStore'
import { saveRecurringTemplate } from '../recurringStore'
import { Button, Card, Input } from '../components/ui'
import { getMonthContext } from './financialOverview'
import styles from './Launch.module.css'

interface LaunchFormState {
  costType: CostType
  dreGroup: DreGroup
  categoryId: string
  description: string
  amount: string
  notes: string
  recurring: boolean
}

interface ValidationErrors {
  categoryId?: string
  description?: string
  amount?: string
}

function dreGroupLabel(dreGroup: DreGroup) {
  if (dreGroup === 'revenue') {
    return 'Receita'
  }

  if (dreGroup === 'deductions') {
    return 'Dedução'
  }

  return 'Despesa'
}

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
    recurring: false,
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const descriptionRef = useRef<HTMLDivElement>(null)

  const monthContext = getMonthContext()
  const currentMonth = useMemo(() => monthFromNow(), [])

  const availableCategories = useMemo(
    () => listCategories({ costType: form.costType, dreGroup: form.dreGroup }),
    [form.costType, form.dreGroup]
  )

  const descriptionSuggestions = useMemo(() => {
    const q = form.description.trim().toLowerCase()
    if (q.length < 2) return []
    const seen = new Set<string>()
    return listLaunchEntries({ companyId: monthContext.companyId, costType: form.costType, dreGroup: form.dreGroup })
      .filter((e) => e.description.toLowerCase().includes(q))
      .filter((e) => { if (seen.has(e.description)) return false; seen.add(e.description); return true })
      .slice(0, 5)
  }, [form.description, form.costType, form.dreGroup, monthContext.companyId])

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

    if (monthLifecycleStore.isMonthClosed({ companyId: monthContext.companyId, month: currentMonth })) {
      setStatusMessage('Este mês está fechado. Reabra em Revisão do Mês para incluir ou editar lançamentos.')
      return
    }

    const selectedCategory = availableCategories.find((category) => category.id === form.categoryId)
    if (!selectedCategory) {
      setErrors((currentErrors) => ({ ...currentErrors, categoryId: 'Categoria inválida para este tipo/natureza.' }))
      return
    }

    const entryId = nextEntryId()
    const entry = createLaunchEntry({
      id: entryId,
      companyId: monthContext.companyId,
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

    if (form.recurring) {
      saveRecurringTemplate({
        id: `rec-${entryId}`,
        companyId: monthContext.companyId,
        costType: form.costType,
        dreGroup: form.dreGroup,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        description: form.description,
        amount: parseBrazilianAmount(form.amount),
        createdAt: new Date().toISOString(),
      })
    }

    setSavedEntryId(String(ingestionRecord.source_id))
    setStatusMessage('')
    setShowSuggestions(false)

    setForm((prevState) => ({
      ...prevState,
      categoryId: '',
      description: '',
      amount: '',
      notes: '',
      recurring: false,
    }))
  }

  function updateCostType(nextCostType: CostType) {
    setForm((prevState) => ({
      ...prevState,
      costType: nextCostType,
      categoryId: '',
      dreGroup: nextCostType === 'personal' && prevState.dreGroup === 'deductions' ? 'expenses' : prevState.dreGroup,
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
                {form.costType === 'company' && (
                  <button
                    type="button"
                    className={`${styles.intentButton} ${form.dreGroup === 'deductions' ? styles.intentActive : ''}`}
                    onClick={() => updateDreGroup('deductions')}
                    aria-pressed={form.dreGroup === 'deductions'}
                  >
                    Abatimento fiscal
                  </button>
                )}
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

              <div className={styles.descriptionWrapper} ref={descriptionRef}>
                <Input
                  label="Descrição"
                  placeholder={
                    form.dreGroup === 'revenue'
                      ? 'Ex.: venda balcão'
                      : form.dreGroup === 'deductions'
                        ? 'Ex.: desconto incondicional concedido'
                        : 'Ex.: aluguel do escritório'
                  }
                  helperText="Use um nome curto e direto."
                  value={form.description}
                  onChange={(event) => {
                    setForm((prevState) => ({ ...prevState, description: event.target.value }))
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  errorText={errors.description}
                />
                {showSuggestions && descriptionSuggestions.length > 0 && (
                  <ul className={styles.suggestions} role="listbox">
                    {descriptionSuggestions.map((s) => (
                      <li
                        key={s.id}
                        className={styles.suggestionItem}
                        role="option"
                        aria-selected={false}
                        onMouseDown={() => {
                          setForm((prev) => ({
                            ...prev,
                            description: s.description,
                            categoryId: s.categoryId,
                            amount: s.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                          }))
                          setShowSuggestions(false)
                        }}
                      >
                        <span className={styles.suggestionDesc}>{s.description}</span>
                        <span className={styles.suggestionMeta}>{s.categoryName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Input
                label="Valor"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={(event) =>
                  setForm((prevState) => ({
                    ...prevState,
                    amount: formatAmountInput(event.target.value),
                  }))
                }
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
                  <label className={styles.recurringToggle}>
                    <input
                      type="checkbox"
                      checked={form.recurring}
                      onChange={(e) => setForm((prev) => ({ ...prev, recurring: e.target.checked }))}
                    />
                    <span>
                      <strong>Repetir mensalmente</strong>
                      <span className={styles.recurringHint}> — será sugerido todo mês no Dashboard</span>
                    </span>
                  </label>
                </div>
              </details>
            </div>
          </section>

          <section className={styles.step} aria-label="Passo 3 de 3">
            <h2 className={styles.stepTitle}>3. Confirmar e salvar</h2>
            <p className={styles.stepHint}>
              Empresa ativa: <strong>{monthContext.companyId}</strong> · Mês: <strong>{currentMonth}</strong>
            </p>
            <p className={styles.stepHint}>
              Natureza selecionada: <strong>{dreGroupLabel(form.dreGroup)}</strong>. No Simples Nacional, deduções reduzem
              a base de cálculo da receita bruta e devem ser registradas separadamente de despesas.
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
