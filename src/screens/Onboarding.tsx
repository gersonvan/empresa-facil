import { useState, type FormEvent } from 'react'
import { API_URL } from '../config'
import { getAuthToken } from '../authStore'
import {
  createCompany,
  updateCompany,
  setActiveCompany,
  listCompanies,
  getActiveCompany,
} from '../companyStore'
import { upsertTaxProfile } from '../taxProfileStore'
import styles from './Onboarding.module.css'

// ── Dados de suporte ──────────────────────────────────────────────────────────

const SEGMENTS = [
  { value: 'Serviços', label: 'Serviços' },
  { value: 'Tecnologia', label: 'Tecnologia' },
  { value: 'Comércio', label: 'Comércio' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Educação', label: 'Educação' },
  { value: 'Outros', label: 'Outros' },
]

const REGIMES = [
  {
    value: 'mei',
    label: 'MEI',
    desc: 'Microempreendedor Individual',
    hint: 'Faturamento até R$ 81 mil/ano',
  },
  {
    value: 'simples',
    label: 'Simples Nacional',
    desc: 'Regime unificado para pequenas empresas',
    hint: 'Faturamento até R$ 4,8 mi/ano',
  },
  {
    value: 'presumido',
    label: 'Lucro Presumido',
    desc: 'Tributação sobre margem estimada',
    hint: 'Para empresas maiores ou fora do Simples',
  },
  {
    value: 'real',
    label: 'Lucro Real',
    desc: 'Tributação sobre lucro contábil efetivo',
    hint: 'Obrigatório acima de R$ 78 mi/ano',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCnpj(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function parseBRL(raw: string) {
  return Number(raw.replace(/\./g, '').replace(',', '.'))
}

function formatBRL(value: number) {
  if (!value) return ''
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Componente ────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

interface FormState {
  companyName: string
  cnpj: string
  segment: string
  regime: string
  annualRevenue: string
}

export default function Onboarding() {
  const existingCompany = getActiveCompany() ?? listCompanies().find((c) => c.status === 'active') ?? null
  const isExisting = existingCompany !== null

  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    companyName: existingCompany?.name ?? '',
    cnpj: existingCompany?.cnpj ?? '',
    segment: existingCompany?.segment ?? '',
    regime: 'simples',
    annualRevenue: '',
  })

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ── Navegação ────────────────────────────────────────────────────────────────

  function handleStep1(e: FormEvent) {
    e.preventDefault()
    if (!form.companyName.trim()) return
    setStep(2)
  }

  function handleStep2(e: FormEvent) {
    e.preventDefault()
    const revenue = parseBRL(form.annualRevenue)
    if (!revenue || revenue <= 0) return
    setStep(3)
  }

  // ── Submit final ─────────────────────────────────────────────────────────────

  async function handleFinish() {
    setSubmitting(true)
    setError(null)

    try {
      // 1. Salvar empresa no localStorage
      let company = existingCompany

      if (isExisting && company) {
        updateCompany(company.id, {
          name: form.companyName.trim(),
          cnpj: form.cnpj,
          segment: form.segment || undefined,
        })
        company = { ...company, name: form.companyName.trim() }
      } else {
        company = createCompany({
          name: form.companyName.trim(),
          cnpj: form.cnpj || undefined,
          segment: form.segment || undefined,
        })
      }

      setActiveCompany(company.id)

      // 2. Salvar perfil tributário
      upsertTaxProfile({
        companyId: company.id,
        annualRevenueForecast: parseBRL(form.annualRevenue),
      })

      // 3. Reivindicar ownership no servidor
      const token = getAuthToken()
      if (token) {
        await fetch(`${API_URL}/api/companies/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ companyIds: [company.id] }),
        })
      }

      // 4. Recarregar para que o sync client rode o pull com os dados atualizados
      window.location.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.brandMark}>EF</div>
          <div className={styles.stepIndicator}>
            {([1, 2, 3] as Step[]).map((n) => (
              <div
                key={n}
                className={`${styles.stepDot} ${step === n ? styles.stepDotActive : ''} ${step > n ? styles.stepDotDone : ''}`}
              />
            ))}
          </div>
        </div>

        {/* ── Passo 1: Empresa ── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className={styles.stepForm}>
            <div className={styles.stepHeading}>
              <h1 className={styles.title}>
                {isExisting ? 'Confirme sua empresa' : 'Configure sua empresa'}
              </h1>
              {isExisting && (
                <p className={styles.subtitle}>Detectamos dados existentes. Confirme ou ajuste.</p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Nome da empresa *</label>
              <input
                className={styles.input}
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder="Ex: Minha Empresa Ltda"
                required
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>CNPJ <span className={styles.optional}>(opcional)</span></label>
              <input
                className={styles.input}
                value={formatCnpj(form.cnpj)}
                onChange={(e) => set('cnpj', e.target.value.replace(/\D/g, ''))}
                placeholder="XX.XXX.XXX/XXXX-XX"
                inputMode="numeric"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Segmento <span className={styles.optional}>(opcional)</span></label>
              <select
                className={styles.select}
                value={form.segment}
                onChange={(e) => set('segment', e.target.value)}
              >
                <option value="">Selecione…</option>
                {SEGMENTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={!form.companyName.trim()}>
              Continuar
            </button>
          </form>
        )}

        {/* ── Passo 2: Tributação ── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className={styles.stepForm}>
            <div className={styles.stepHeading}>
              <h1 className={styles.title}>Tributação</h1>
              <p className={styles.subtitle}>
                Essas informações melhoram as estimativas de imposto no app.
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Regime tributário</label>
              <div className={styles.regimeGrid}>
                {REGIMES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`${styles.regimeCard} ${form.regime === r.value ? styles.regimeCardActive : ''}`}
                    onClick={() => set('regime', r.value)}
                  >
                    <span className={styles.regimeLabel}>{r.label}</span>
                    <span className={styles.regimeDesc}>{r.desc}</span>
                    <span className={styles.regimeHint}>{r.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Faturamento anual estimado *</label>
              <div className={styles.currencyInput}>
                <span className={styles.currencyPrefix}>R$</span>
                <input
                  className={`${styles.input} ${styles.inputCurrency}`}
                  value={form.annualRevenue}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d,.]/g, '')
                    set('annualRevenue', raw)
                  }}
                  onBlur={() => {
                    const n = parseBRL(form.annualRevenue)
                    if (n > 0) set('annualRevenue', formatBRL(n))
                  }}
                  placeholder="0,00"
                  inputMode="decimal"
                  required
                />
              </div>
            </div>

            <div className={styles.navRow}>
              <button type="button" className={styles.ghostBtn} onClick={() => setStep(1)}>
                Voltar
              </button>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={parseBRL(form.annualRevenue) <= 0}
              >
                Continuar
              </button>
            </div>
          </form>
        )}

        {/* ── Passo 3: Confirmação ── */}
        {step === 3 && (
          <div className={styles.stepForm}>
            <div className={styles.stepHeading}>
              <div className={styles.checkIcon}>✓</div>
              <h1 className={styles.title}>Tudo pronto!</h1>
              <p className={styles.subtitle}>Confirme os dados antes de começar.</p>
            </div>

            <div className={styles.summaryCard}>
              <SummaryRow label="Empresa" value={form.companyName} />
              {form.cnpj && <SummaryRow label="CNPJ" value={formatCnpj(form.cnpj)} />}
              {form.segment && <SummaryRow label="Segmento" value={form.segment} />}
              <SummaryRow
                label="Regime"
                value={REGIMES.find((r) => r.value === form.regime)?.label ?? '—'}
              />
              <SummaryRow label="Faturamento anual" value={`R$ ${form.annualRevenue}`} />
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.navRow}>
              <button type="button" className={styles.ghostBtn} onClick={() => setStep(2)} disabled={submitting}>
                Voltar
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleFinish}
                disabled={submitting}
              >
                {submitting ? 'Salvando…' : 'Começar a usar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  )
}
