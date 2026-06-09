import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ScreenContainer from '../components/ScreenContainer'
import { Card } from '../components/ui'
import { getAuthToken } from '../authStore'
import { API_URL } from '../config'
import styles from './AdminUsers.module.css'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  email: string
  name: string
  is_admin: boolean
  created_at: string
  company_count: number
}

function authHeader(): Record<string, string> {
  const t = getAuthToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      const res = await fetch(`${API_URL}/admin/users?${params}`, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json() as { users: AdminUser[]; total: number }
        setUsers(data.users)
        setTotal(data.total)
      } else {
        setError('Erro ao carregar usuários.')
      }
    } catch {
      setError('Sem conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <ScreenContainer title="Usuários">

      <div className={styles.topBar}>
        <Link to="/admin" className={styles.backLink}>← Painel admin</Link>
      </div>

      <Card>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>
            Usuários {total > 0 && <span className={styles.totalBadge}>{total}</span>}
          </h2>
        </div>

        {loading && <p className={styles.helper}>Carregando…</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {!loading && users.length === 0 && (
          <p className={styles.helper}>Nenhum usuário encontrado.</p>
        )}

        {!loading && users.length > 0 && (
          <>
            <ul className={styles.list}>
              {users.map((u) => (
                <li key={u.id} className={styles.row}>
                  <div className={styles.avatar} aria-hidden="true">
                    {initials(u.name || u.email)}
                  </div>

                  <div className={styles.info}>
                    <p className={styles.userName}>
                      {u.name || u.email}
                      {u.is_admin && <span className={styles.adminTag}>Admin</span>}
                    </p>
                    <p className={styles.userEmail}>{u.email}</p>
                  </div>

                  <div className={styles.meta}>
                    <span className={styles.companiesCount}>
                      {u.company_count} empresa{u.company_count !== 1 ? 's' : ''}
                    </span>
                    <span className={styles.joinDate}>desde {formatDate(u.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>

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
