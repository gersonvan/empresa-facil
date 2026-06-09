import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { getAuthToken } from '../authStore'
import { API_URL } from '../config'
import styles from './AdminCompany.module.css'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Subscription {
  company_id: string
  plan: string
  status: string
  created_at: string
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  current_period_end: string | null
}

interface Member {
  user_id: string
  name: string
  email: string
  role: string
  status: string
  created_at: string
}

interface CompanyDetail {
  subscription: Subscription
  members: Member[]
  eventCount: number
  lastSyncAt: string | null
}

const PLAN_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', business: 'Business' }
const ROLE_LABELS: Record<string, string> = { owner: 'Proprietário', member: 'Membro', accountant: 'Contador' }

function authHeader(): Record<string, string> {
  const t = getAuthToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AdminCompany() {
  const { companyId } = useParams<{ companyId: string }>()
  const [data, setData] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Troca de plano
  const [newPlan, setNewPlan] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/admin/companies/${companyId}`, {
        headers: authHeader(),
      })
      if (res.ok) {
        const detail = await res.json() as CompanyDetail
        setData(detail)
        setNewPlan(detail.subscription.plan)
      } else {
        setError('Empresa não encontrada.')
      }
    } catch {
      setError('Sem conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { load() }, [load])

  async function handleSavePlan() {
    if (!companyId || !newPlan) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`${API_URL}/admin/companies/${companyId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ plan: newPlan }),
      })
      if (res.ok) {
        setSaveMsg({ type: 'success', text: `Plano alterado para ${PLAN_LABELS[newPlan]}.` })
        await load()
      } else {
        const body = await res.json() as { error: string }
        setSaveMsg({ type: 'error', text: body.error ?? 'Erro ao salvar.' })
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Sem conexão.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenContainer title="Empresa — Admin">
      <div className={styles.backRow}>
        <Link to="/admin" className={styles.backLink}>← Voltar para Admin</Link>
      </div>

      {loading && <Card><p className={styles.helper}>Carregando…</p></Card>}
      {error && <Card><p className={styles.errorMsg}>{error}</p></Card>}

      {data && (
        <>
          {/* Assinatura */}
          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Assinatura</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>ID da empresa</span>
                <code className={styles.infoCode}>{data.subscription.company_id}</code>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Cadastro</span>
                <span>{formatDate(data.subscription.created_at)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Lançamentos sincronizados</span>
                <span>{data.eventCount.toLocaleString('pt-BR')}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Último sync</span>
                <span>{data.lastSyncAt ? formatDate(data.lastSyncAt) : '—'}</span>
              </div>
              {data.subscription.stripe_subscription_id && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Stripe ID</span>
                  <code className={styles.infoCode}>{data.subscription.stripe_subscription_id}</code>
                </div>
              )}
            </div>

            {/* Trocar plano */}
            <div className={styles.planRow}>
              <select
                className={styles.planSelect}
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                disabled={saving}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
              <Button
                size="sm"
                onClick={handleSavePlan}
                disabled={saving || newPlan === data.subscription.plan}
              >
                {saving ? 'Salvando…' : 'Alterar plano'}
              </Button>
            </div>
            {saveMsg && (
              <p className={saveMsg.type === 'success' ? styles.successMsg : styles.errorMsg}>
                {saveMsg.text}
              </p>
            )}
          </Card>

          {/* Membros */}
          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Membros <span className={styles.countBadge}>{data.members.length}</span>
            </h2>

            {data.members.length === 0 ? (
              <p className={styles.helper}>Nenhum membro ativo.</p>
            ) : (
              <ul className={styles.memberList}>
                {data.members.map((m) => (
                  <li key={m.user_id} className={styles.memberRow}>
                    <div className={styles.memberInfo}>
                      <p className={styles.memberName}>{m.name}</p>
                      <p className={styles.memberEmail}>{m.email}</p>
                    </div>
                    <div className={styles.memberBadges}>
                      <span className={`${styles.badge} ${styles[`role_${m.role}`]}`}>
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                      {m.status === 'pending' && (
                        <span className={`${styles.badge} ${styles.badgePending}`}>Pendente</span>
                      )}
                    </div>
                    <span className={styles.memberDate}>{formatDate(m.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </ScreenContainer>
  )
}
