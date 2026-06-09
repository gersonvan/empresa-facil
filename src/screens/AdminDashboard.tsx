import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ScreenContainer from '../components/ScreenContainer'
import { Card } from '../components/ui'
import { getAuthToken } from '../authStore'
import { API_URL } from '../config'
import styles from './AdminDashboard.module.css'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number
  totalCompanies: number
  activeSubscriptions: number
  byPlan: { free: number; pro: number; business: number }
  recentUsers: Array<{ id: string; email: string; name: string; created_at: string }>
}

interface Company {
  company_id: string
  plan: string
  status: string
  created_at: string
  member_count: number
  owner_name: string | null
  owner_email: string | null
}

const PLAN_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', business: 'Business' }
const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo', trial: 'Trial', past_due: 'Inadimplente', cancelled: 'Cancelado',
}

function authHeader(): Record<string, string> {
  const t = getAuthToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function shortId(id: string) {
  return id.replace(/^company-/, '').slice(0, 8)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (planFilter) params.set('plan', planFilter)

      const [statsRes, companiesRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers: authHeader() }),
        fetch(`${API_URL}/admin/companies?${params}`, { headers: authHeader() }),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (companiesRes.ok) {
        const data = await companiesRes.json()
        setCompanies(data.companies)
        setTotal(data.total)
      } else {
        setError('Erro ao carregar dados.')
      }
    } catch {
      setError('Sem conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }, [page, planFilter])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <ScreenContainer title="Administração">

      {/* KPI cards */}
      {stats && (
        <div className={styles.kpiGrid}>
          <Card className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Usuários</p>
            <strong className={styles.kpiValue}>{stats.totalUsers}</strong>
          </Card>
          <Card className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Empresas</p>
            <strong className={styles.kpiValue}>{stats.totalCompanies}</strong>
          </Card>
          <Card className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Free</p>
            <strong className={styles.kpiValue}>{stats.byPlan.free}</strong>
          </Card>
          <Card className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Pro</p>
            <strong className={`${styles.kpiValue} ${styles.pro}`}>{stats.byPlan.pro}</strong>
          </Card>
          <Card className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Business</p>
            <strong className={`${styles.kpiValue} ${styles.business}`}>{stats.byPlan.business}</strong>
          </Card>
        </div>
      )}

      {/* Cadastros recentes */}
      {stats && stats.recentUsers.length > 0 && (
        <Card className={styles.recentCard}>
          <h2 className={styles.sectionTitle}>Últimos cadastros</h2>
          <ul className={styles.recentList}>
            {stats.recentUsers.map((u) => (
              <li key={u.id} className={styles.recentRow}>
                <span className={styles.recentName}>{u.name}</span>
                <span className={styles.recentEmail}>{u.email}</span>
                <span className={styles.recentDate}>{formatDate(u.created_at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Tabela de empresas */}
      <Card>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>
            Empresas {total > 0 && <span className={styles.totalBadge}>{total}</span>}
          </h2>
          <select
            className={styles.planFilter}
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
          >
            <option value="">Todos os planos</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
        </div>

        {loading && <p className={styles.helper}>Carregando…</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {!loading && companies.length === 0 && (
          <p className={styles.helper}>Nenhuma empresa encontrada.</p>
        )}

        {!loading && companies.length > 0 && (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Proprietário</th>
                    <th>Plano</th>
                    <th>Status</th>
                    <th>Membros</th>
                    <th>Desde</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.company_id}>
                      <td className={styles.idCell}>
                        <code>{shortId(c.company_id)}</code>
                      </td>
                      <td>
                        <p className={styles.ownerName}>{c.owner_name ?? '—'}</p>
                        <p className={styles.ownerEmail}>{c.owner_email ?? '—'}</p>
                      </td>
                      <td>
                        <span className={`${styles.planBadge} ${styles[`plan_${c.plan}`]}`}>
                          {PLAN_LABELS[c.plan] ?? c.plan}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status_${c.status}`]}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className={styles.centerCell}>{c.member_count}</td>
                      <td className={styles.dateCell}>{formatDate(c.created_at)}</td>
                      <td>
                        <Link to={`/admin/companies/${c.company_id}`} className={styles.detailLink}>
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  ‹ Anterior
                </button>
                <span className={styles.pageInfo}>{page} / {totalPages}</span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Próxima ›
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </ScreenContainer>
  )
}
