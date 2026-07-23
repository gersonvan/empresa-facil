import { useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import ScreenContainer from '../components/ScreenContainer'
import { createLaunchEntry } from '../domain'
import { toIngestionRecord } from '../contracts'
import { listCategories, type CostType, type DreGroup } from '../categoryStore'
import { monthLifecycleStore } from '../monthLifecycle'
import { listLaunchEntries, saveLaunchEntry, type AccountOrigin } from '../launchStore'
import { saveRecurringTemplate } from '../recurringStore'
import { Button, Card, Input } from '../components/ui'
import { getMonthContext } from './financialOverview'
import styles from './Launch.module.css'

interface LaunchFormState {
  costType: CostType
  accountOrigin: AccountOrigin
  dreGroup: DreGroup
  categoryId: string
  description: string
  amount: string
  notes: string
  recurring: boolean
}

interface ValidationErrors {
  categoryId?: string
  amount?: string
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
    accountOrigin: initialIntent,
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
      accountOrigin: form.accountOrigin,
      description: form.description.trim() || selectedCategory.name,
      amount: parseBrazilianAmount(form.amount),
    })

    // Keep payload compatibility visible in UI for manual and import parity.
    const ingestionRecord = toIngestionRecord(entry)
    saveLaunchEntry({
      ...entry,
      dreGroup: form.dreGroup,
      accountOrigin: form.accountOrigin,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      createdAt: new Date().toISOString(),
    })

    if (form.recurring) {
      saveRecurringTemplate({
        id: `rec-${entryId}`,
        companyId: monthContext.companyId,
        costType: form.costType,
        accountOrigin: form.accountOrigin,
        dreGroup: form.dreGroup,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        description: form.description.trim() || selectedCategory.name,
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
      accountOrigin: prevState.accountOrigin === prevState.costType ? nextCostType : prevState.accountOrigin,
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

  const isPersonal = form.costType === 'personal'
  const isMoneyIn = form.dreGroup === 'revenue'
  const saveLabel = isPersonal
    ? isMoneyIn
      ? 'Salvar entrada pessoal'
      : 'Salvar gasto pessoal'
    : isMoneyIn
      ? 'Salvar entrada da empresa'
      : form.dreGroup === 'deductions'
        ? 'Salvar ajuste fiscal'
        : 'Salvar gasto da empresa'

  return (
    <ScreenContainer title={isPersonal ? 'Registrar movimento pessoal' : 'Registrar movimento da empresa'}>
      <Card className={styles.formCard}>
        <form className={styles.formGrid} onSubmit={submitForm}>
          <section className={styles.step} aria-label="Passo 1 de 3">
            <h2 className={styles.stepTitle}>1. Este dinheiro é de quem?</h2>
            <p className={styles.stepHint}>Escolha o contexto. Ele define as categorias e o que aparece nos seus relatórios.</p>
            <div className={styles.intentOptions} role="group" aria-label="Tipo de lançamento">
              <button
                type="button"
                className={`${styles.intentButton} ${styles.companyIntent} ${form.costType === 'company' ? styles.intentActive : ''}`}
                onClick={() => updateCostType('company')}
                aria-pressed={form.costType === 'company'}
              >
                <span aria-hidden="true">🏢</span>
                <span><strong>Empresa</strong><small>Afeta o resultado do negócio</small></span>
              </button>
              <button
                type="button"
                className={`${styles.intentButton} ${styles.personalIntent} ${form.costType === 'personal' ? styles.intentActive : ''}`}
                onClick={() => updateCostType('personal')}
                aria-pressed={form.costType === 'personal'}
              >
                <span aria-hidden="true">👤</span>
                <span><strong>Pessoal</strong><small>Fica separado da empresa</small></span>
              </button>
            </div>
          </section>

          <section className={styles.step} aria-label="Passo 2 de 3">
            <h2 className={styles.stepTitle}>2. O dinheiro entrou ou saiu?</h2>
            <div className={styles.fields}>
              <div className={styles.intentOptions} role="group" aria-label="Tipo de movimentação">
                <button
                  type="button"
                  className={`${styles.intentButton} ${form.dreGroup === 'revenue' ? styles.intentActive : ''}`}
                  onClick={() => updateDreGroup('revenue')}
                  aria-pressed={form.dreGroup === 'revenue'}
                >
                  Entrou dinheiro
                </button>
                <button
                  type="button"
                  className={`${styles.intentButton} ${form.dreGroup === 'expenses' ? styles.intentActive : ''}`}
                  onClick={() => updateDreGroup('expenses')}
                  aria-pressed={form.dreGroup === 'expenses'}
                >
                  Saiu dinheiro
                </button>
              </div>

              <label className={styles.selectField} htmlFor="launch-account-origin">
                <span>Qual conta {isMoneyIn ? 'recebeu' : 'pagou'}?</span>
                <select
                  id="launch-account-origin"
                  value={form.accountOrigin}
                  onChange={(event) =>
                    setForm((prevState) => ({ ...prevState, accountOrigin: event.target.value as AccountOrigin }))
                  }
                >
                  <option value="company">Conta da empresa</option>
                  <option value="personal">Conta pessoal</option>
                  <option value="unknown">Não sei agora</option>
                </select>
                <small className={styles.accountOriginHint}>Ajuda a identificar quando dinheiro pessoal e da empresa se misturam.</small>
              </label>

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
                      : isPersonal
                        ? 'Ex.: mercado ou gasolina'
                        : 'Ex.: aluguel do escritório'
                  }
                  helperText="Opcional. Se deixar em branco, usaremos a categoria escolhida."
                  value={form.description}
                  onChange={(event) => {
                    setForm((prevState) => ({ ...prevState, description: event.target.value }))
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
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
              <label className={`${styles.recurringCard} ${form.recurring ? styles.recurringCardActive : ''}`}>
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm((prev) => ({ ...prev, recurring: e.target.checked }))}
                  className={styles.recurringCardCheckbox}
                />
                <span className={styles.recurringCardIcon}>🔁</span>
                <span className={styles.recurringCardText}>
                  <strong>Repetir mensalmente</strong>
                  <span className={styles.recurringHint}> — será sugerido todo mês no Dashboard</span>
                </span>
              </label>
              <details className={styles.optionalDetails}>
                <summary className={styles.optionalSummary}>Adicionar detalhes (opcional)</summary>
                <div className={styles.optionalContent}>
                  <Input
                    label="Observação"
                    placeholder="Ex.: ajustar centro de custo depois"
                    value={form.notes}
                    onChange={(event) => setForm((prevState) => ({ ...prevState, notes: event.target.value }))}
                  />
                  {!isPersonal && (
                    <button
                      type="button"
                      className={`${styles.fiscalOption} ${form.dreGroup === 'deductions' ? styles.fiscalOptionActive : ''}`}
                      onClick={() => updateDreGroup('deductions')}
                      aria-pressed={form.dreGroup === 'deductions'}
                    >
                      <strong>Registrar abatimento fiscal</strong>
                      <span>Use apenas para descontos que reduzem a receita bruta.</span>
                    </button>
                  )}
                </div>
              </details>
            </div>
          </section>

          <section className={styles.step} aria-label="Passo 3 de 3">
            <h2 className={styles.stepTitle}>3. Confirmar e salvar</h2>
            <p className={styles.stepHint}>{isPersonal ? 'Movimento pessoal · não entra no resultado da empresa.' : <>Para: <strong>{monthContext.companyName}</strong> · Mês: <strong>{currentMonth}</strong></>}</p>
            {form.dreGroup === 'deductions' && !isPersonal ? (
              <p className={styles.stepHint}>Ajuste fiscal selecionado. No Simples Nacional, ele reduz a receita bruta e não deve ser usado para despesas comuns.</p>
            ) : null}
            <Button type="submit" variant="primary" fullWidth>
              {saveLabel}
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
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 12 }}>
        Tem vários lançamentos do banco?{' '}
        <Link to="/import-ofx" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
          Importar extrato OFX
        </Link>{' '}
        é mais rápido.
      </p>
    </ScreenContainer>
  )
}
