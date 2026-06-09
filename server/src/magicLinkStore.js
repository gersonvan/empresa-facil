import { randomBytes, createHash } from 'node:crypto'
import { randomUUID } from 'node:crypto'

const TOKEN_BYTES = 32
const EXPIRY_MINUTES = 15

function generateToken() {
  return randomBytes(TOKEN_BYTES).toString('hex')
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

class MagicLinkStore {
  constructor({ pool }) {
    this.pool = pool
  }

  async create({ email, purpose, companyId = null, invitedRole = null, invitedBy = null }) {
    const token = generateToken()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000)
    const normalizedEmail = email.toLowerCase().trim()

    // Invalidate previous unused tokens for the same email + purpose
    await this.pool.query(
      `UPDATE magic_link_tokens
       SET used_at = NOW()
       WHERE email = $1 AND purpose = $2 AND used_at IS NULL`,
      [normalizedEmail, purpose]
    )

    await this.pool.query(
      `INSERT INTO magic_link_tokens
         (id, email, token_hash, purpose, company_id, invited_role, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [randomUUID(), normalizedEmail, tokenHash, purpose, companyId, invitedRole, invitedBy, expiresAt]
    )

    return token
  }

  async verify(rawToken) {
    const tokenHash = hashToken(rawToken)

    const result = await this.pool.query(
      `SELECT * FROM magic_link_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
      [tokenHash]
    )

    const row = result.rows[0]
    if (!row) return null

    await this.pool.query(
      'UPDATE magic_link_tokens SET used_at = NOW() WHERE id = $1',
      [row.id]
    )

    return row
  }
}

export { MagicLinkStore }
