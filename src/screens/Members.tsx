import { useState, useEffect, useCallback } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Button, Card } from '../components/ui'
import { getActiveCompany } from '../companyStore'
import { getAuthToken } from '../authStore'
import { API_URL } from '../config'
import styles from './Members.module.css'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Role = 'owner' | 'member' | 'accountant'
type MemberStatus = 'active' | 'pending'

interface Member {
  id: string
  user_id: string
  email: string
  name: string
  avatar_url: string | null
  role: Role
  status: MemberStatus
  invited_by_email: string | null
  created_at: string
}

interface CurrentUser {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Proprietário',
  member: 'Membro',
  accountant: 'Contador',
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

function authHeader(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function Members() {
  const company = getActiveCompany()
  const companyId = company?.id

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulário de convite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'accountant'>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Ação em andamento (revoke / change role)
  const [actionTarget, setActionTarget] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)
    try {
      const [meRes, membersRes] = await Promise.all([
        fetch(`${API_URL}/auth/me`, { headers: authHeader() }),
        fetch(`${API_URL}/api/companies/${companyId}/members`, { headers: authHeader() }),
      ])

      if (meRes.ok) {
        const data = await meRes.json() as { user: CurrentUser }
        setCurrentUser(data.user)
      }

      if (membersRes.ok) {
        setMembers(await membersRes.json() as Member[])
      } else {
        setError('Não foi possível carregar os membros.')
      }
    } catch {
      setError('Sem conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { load() }, [load])

  // Papel do usuário atual nesta empresa
  const myMembership = members.find((m) => m.user_id === currentUser?.id)
  const isOwner = myMembership?.role === 'owner'

  // ── Convidar ──────────────────────────────────────────────────────────────────

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId || !inviteEmail.trim()) return
    setInviting(true)
    setInviteMsg(null)

    try {
      const res = await fetch(`${API_URL}/api/companies/${companyId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      if (res.ok) {
        setInviteMsg({ type: 'success', text: `Convite enviado para ${inviteEmail.trim()}.` })
        setInviteEmail('')
        await load()
      } else {
        const body = await res.json() as { error: string; plan?: string; limit?: number }
        if (body.error === 'ja_e_membro') {
          setInviteMsg({ type: 'error', text: 'Este usuário já é membro da empresa.' })
        } else if (body.error === 'limite_de_membros') {
          setInviteMsg({
            type: 'error',
            text: `Limite de membros do plano ${body.plan ?? 'free'} atingido (máx. ${body.limit}). Faça upgrade para convidar mais.`,
          })
        } else {
          setInviteMsg({ type: 'error', text: 'Erro ao enviar convite. Tente novamente.' })
        }
      }
    } catch {
      setInviteMsg({ type: 'error', text: 'Sem conexão com o servidor.' })
    } finally {
      setInviting(false)
    }
  }

  // ── Revogar ───────────────────────────────────────────────────────────────────

  async function handleRevoke(member: Member) {
    if (!companyId) return
    if (!window.confirm(`Remover o acesso de ${member.name || member.email}?`)) return
    setActionTarget(member.user_id)
    try {
      const res = await fetch(
        `${API_URL}/api/companies/${companyId}/members/${member.user_id}`,
        { method: 'DELETE', headers: authHeader() }
      )
      if (res.ok) await load()
    } finally {
      setActionTarget(null)
    }
  }

  // ── Mudar papel ───────────────────────────────────────────────────────────────

  async function handleRoleChange(member: Member, role: 'member' | 'accountant') {
    if (!companyId) return
    setActionTarget(member.user_id)
    try {
      await fetch(`${API_URL}/api/companies/${companyId}/members/${member.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ role }),
      })
      await load()
    } finally {
      setActionTarget(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!companyId) {
    return (
      <ScreenContainer title="Equipe">
        <Card><p className={styles.emptyText}>Nenhuma empresa ativa selecionada.</p></Card>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer title="Equipe">

      {/* Formulário de convite — apenas para owners */}
      {isOwner && (
        <Card className={styles.inviteCard}>
          <h2 className={styles.sectionTitle}>Convidar pessoa</h2>
          <p className={styles.helper}>
            O convidado receberá um link por e-mail para acessar esta empresa.
          </p>

          <form className={styles.inviteForm} onSubmit={handleInvite}>
            <input
              type="email"
              className={styles.emailInput}
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              disabled={inviting}
            />
            <select
              className={styles.roleSelect}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'accountant')}
              disabled={inviting}
            >
              <option value="member">Membro</option>
              <option value="accountant">Contador</option>
            </select>
            <Button type="submit" size="sm" disabled={inviting || !inviteEmail.trim()}>
              {inviting ? 'Enviando…' : 'Convidar'}
            </Button>
          </form>

          {inviteMsg && (
            <p className={inviteMsg.type === 'success' ? styles.successMsg : styles.errorMsg}>
              {inviteMsg.text}
            </p>
          )}
        </Card>
      )}

      {/* Lista de membros */}
      <Card>
        <h2 className={styles.sectionTitle}>Membros</h2>

        {loading && <p className={styles.helper}>Carregando…</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {!loading && members.length === 0 && (
          <p className={styles.emptyText}>Nenhum membro encontrado.</p>
        )}

        {!loading && members.length > 0 && (
          <ul className={styles.list}>
            {members.map((member) => {
              const isMe = member.user_id === currentUser?.id
              const busy = actionTarget === member.user_id
              return (
                <li key={member.id} className={styles.row}>
                  {/* Avatar */}
                  <div className={styles.avatar} aria-hidden="true">
                    {initials(member.name || member.email)}
                  </div>

                  {/* Info */}
                  <div className={styles.info}>
                    <p className={styles.memberName}>
                      {member.name || member.email}
                      {isMe && <span className={styles.meTag}>você</span>}
                    </p>
                    <p className={styles.memberEmail}>{member.email}</p>
                    {member.invited_by_email && member.status === 'pending' && (
                      <p className={styles.invitedBy}>Convidado por {member.invited_by_email}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className={styles.badges}>
                    <span className={`${styles.badge} ${styles[`role_${member.role}`]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                    {member.status === 'pending' && (
                      <span className={`${styles.badge} ${styles.badgePending}`}>Pendente</span>
                    )}
                  </div>

                  {/* Ações (owner only, não pode agir sobre si mesmo) */}
                  {isOwner && !isMe && member.role !== 'owner' && (
                    <div className={styles.actions}>
                      {member.status === 'active' && (
                        <select
                          className={styles.roleChangeSelect}
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member, e.target.value as 'member' | 'accountant')
                          }
                          disabled={busy}
                          title="Mudar papel"
                        >
                          <option value="member">Membro</option>
                          <option value="accountant">Contador</option>
                        </select>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevoke(member)}
                        disabled={busy}
                      >
                        {busy ? '…' : 'Remover'}
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </ScreenContainer>
  )
}
