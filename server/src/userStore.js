import { randomUUID } from 'node:crypto'

class UserStore {
  constructor({ pool }) {
    this.pool = pool
  }

  async findById(id) {
    const result = await this.pool.query(
      'SELECT id, email, name, avatar_url, is_admin, created_at FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0] ?? null
  }

  async findByEmail(email) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )
    return result.rows[0] ?? null
  }

  async #findByProviderId(column, value) {
    const result = await this.pool.query(
      `SELECT * FROM users WHERE ${column} = $1`,
      [value]
    )
    return result.rows[0] ?? null
  }

  async upsertFromOAuth({ provider, providerId, email, name, avatarUrl }) {
    const column = provider === 'google' ? 'google_id' : 'microsoft_id'
    const normalizedEmail = email.toLowerCase().trim()

    let user = await this.#findByProviderId(column, providerId)
    if (!user) {
      user = await this.findByEmail(normalizedEmail)
    }

    if (user) {
      const result = await this.pool.query(
        `UPDATE users
         SET ${column} = $1, name = $2, avatar_url = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING id, email, name, avatar_url`,
        [providerId, name, avatarUrl ?? user.avatar_url, user.id]
      )
      return result.rows[0]
    }

    const result = await this.pool.query(
      `INSERT INTO users (id, email, name, avatar_url, ${column})
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, avatar_url`,
      [randomUUID(), normalizedEmail, name, avatarUrl, providerId]
    )
    return result.rows[0]
  }

  async findOrCreateByEmail(email, name) {
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await this.findByEmail(normalizedEmail)
    if (existing) return existing

    const result = await this.pool.query(
      `INSERT INTO users (id, email, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, avatar_url`,
      [randomUUID(), normalizedEmail, name ?? normalizedEmail.split('@')[0]]
    )
    return result.rows[0]
  }
}

export { UserStore }
