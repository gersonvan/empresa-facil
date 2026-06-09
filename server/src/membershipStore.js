import { randomUUID } from 'node:crypto'

class MembershipStore {
  constructor({ pool }) {
    this.pool = pool
  }

  async findByUserAndCompany(userId, companyId) {
    const result = await this.pool.query(
      'SELECT * FROM company_memberships WHERE user_id = $1 AND company_id = $2',
      [userId, companyId]
    )
    return result.rows[0] ?? null
  }

  async listByUser(userId) {
    const result = await this.pool.query(
      `SELECT cm.id, cm.company_id, cm.role, cm.status, cm.created_at
       FROM company_memberships cm
       WHERE cm.user_id = $1 AND cm.status = 'active'
       ORDER BY cm.created_at ASC`,
      [userId]
    )
    return result.rows
  }

  async listByCompany(companyId) {
    const result = await this.pool.query(
      `SELECT cm.id, cm.role, cm.status, cm.created_at,
              u.id as user_id, u.email, u.name, u.avatar_url,
              inv.email as invited_by_email
       FROM company_memberships cm
       JOIN users u ON u.id = cm.user_id
       LEFT JOIN users inv ON inv.id = cm.invited_by
       WHERE cm.company_id = $1 AND cm.status != 'revoked'
       ORDER BY cm.created_at ASC`,
      [companyId]
    )
    return result.rows
  }

  async create({ userId, companyId, role, invitedBy, status = 'active' }) {
    const existing = await this.findByUserAndCompany(userId, companyId)

    if (existing) {
      if (existing.status === 'revoked') {
        const result = await this.pool.query(
          `UPDATE company_memberships
           SET status = $1, role = $2, invited_by = $3, updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [status, role, invitedBy ?? null, existing.id]
        )
        return result.rows[0]
      }
      return existing
    }

    const result = await this.pool.query(
      `INSERT INTO company_memberships (id, user_id, company_id, role, invited_by, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [randomUUID(), userId, companyId, role, invitedBy ?? null, status]
    )
    return result.rows[0]
  }

  async activate(userId, companyId) {
    const result = await this.pool.query(
      `UPDATE company_memberships
       SET status = 'active', updated_at = NOW()
       WHERE user_id = $1 AND company_id = $2
       RETURNING *`,
      [userId, companyId]
    )
    return result.rows[0] ?? null
  }

  async revoke(userId, companyId) {
    const result = await this.pool.query(
      `UPDATE company_memberships
       SET status = 'revoked', updated_at = NOW()
       WHERE user_id = $1 AND company_id = $2
       RETURNING *`,
      [userId, companyId]
    )
    return result.rows[0] ?? null
  }

  async updateRole(userId, companyId, role) {
    const result = await this.pool.query(
      `UPDATE company_memberships
       SET role = $1, updated_at = NOW()
       WHERE user_id = $2 AND company_id = $3 AND status = 'active'
       RETURNING *`,
      [role, userId, companyId]
    )
    return result.rows[0] ?? null
  }

  async hasAccess(userId, companyId) {
    const membership = await this.findByUserAndCompany(userId, companyId)
    return membership?.status === 'active'
  }

  async getActiveCompanyIds(userId) {
    const result = await this.pool.query(
      `SELECT company_id FROM company_memberships
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    )
    return result.rows.map((row) => row.company_id)
  }
}

export { MembershipStore }
