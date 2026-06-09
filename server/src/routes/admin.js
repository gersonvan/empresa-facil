import { requireAdmin } from '../authMiddleware.js'

async function adminRoutes(fastify) {
  const { pool, subscriptionStore } = fastify

  // ── Estatísticas gerais ───────────────────────────────────────────────────────

  fastify.get('/admin/stats', { preHandler: requireAdmin }, async () => {
    const [usersResult, subResult, recentResult, syncResult] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM users'),

      pool.query(`
        SELECT
          plan,
          COUNT(*) AS count
        FROM subscriptions
        GROUP BY plan
      `),

      pool.query(`
        SELECT id, email, name, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `),

      pool.query(`
        SELECT
          COUNT(DISTINCT company_id) AS total_companies,
          COUNT(*) FILTER (WHERE status = 'active') AS active_subscriptions
        FROM subscriptions
      `),
    ])

    const planCounts = { free: 0, pro: 0, business: 0 }
    for (const row of subResult.rows) {
      if (row.plan in planCounts) planCounts[row.plan] = Number(row.count)
    }

    return {
      totalUsers: Number(usersResult.rows[0].total),
      totalCompanies: Number(syncResult.rows[0].total_companies),
      activeSubscriptions: Number(syncResult.rows[0].active_subscriptions),
      byPlan: planCounts,
      recentUsers: recentResult.rows,
    }
  })

  // ── Listar empresas ───────────────────────────────────────────────────────────

  fastify.get('/admin/companies', { preHandler: requireAdmin }, async (request) => {
    const { plan, page = 1, limit = 20 } = request.query ?? {}
    const offset = (Number(page) - 1) * Number(limit)

    const planFilter = plan ? `AND s.plan = $3` : ''
    const params = plan
      ? [Number(limit), offset, plan]
      : [Number(limit), offset]

    const result = await pool.query(
      `
      SELECT
        s.company_id,
        s.plan,
        s.status,
        s.created_at,
        COUNT(cm.id) FILTER (WHERE cm.status = 'active') AS member_count,
        u.name  AS owner_name,
        u.email AS owner_email
      FROM subscriptions s
      LEFT JOIN company_memberships cm
        ON cm.company_id = s.company_id
      LEFT JOIN company_memberships owner_cm
        ON owner_cm.company_id = s.company_id
        AND owner_cm.role = 'owner'
        AND owner_cm.status = 'active'
      LEFT JOIN users u ON u.id = owner_cm.user_id
      WHERE 1=1 ${planFilter}
      GROUP BY s.company_id, s.plan, s.status, s.created_at, u.name, u.email
      ORDER BY s.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      params
    )

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM subscriptions ${plan ? 'WHERE plan = $1' : ''}`,
      plan ? [plan] : []
    )

    return {
      companies: result.rows,
      total: Number(countResult.rows[0].total),
      page: Number(page),
      limit: Number(limit),
    }
  })

  // ── Detalhes de uma empresa ───────────────────────────────────────────────────

  fastify.get('/admin/companies/:companyId', { preHandler: requireAdmin }, async (request, reply) => {
    const { companyId } = request.params

    const [subResult, membersResult, eventsResult] = await Promise.all([
      pool.query('SELECT * FROM subscriptions WHERE company_id = $1', [companyId]),

      pool.query(
        `SELECT cm.role, cm.status, cm.created_at, u.name, u.email, u.id AS user_id
         FROM company_memberships cm
         JOIN users u ON u.id = cm.user_id
         WHERE cm.company_id = $1 AND cm.status != 'revoked'
         ORDER BY cm.role ASC, cm.created_at ASC`,
        [companyId]
      ),

      pool.query(
        `SELECT
           COUNT(*) AS event_count,
           MAX(synced_at_ms) AS last_sync_ms
         FROM audit_events
         WHERE user_id IN (
           SELECT user_id FROM company_memberships WHERE company_id = $1
         )`,
        [companyId]
      ),
    ])

    if (!subResult.rows[0]) {
      return reply.code(404).send({ error: 'empresa_nao_encontrada' })
    }

    return {
      subscription: subResult.rows[0],
      members: membersResult.rows,
      eventCount: Number(eventsResult.rows[0].event_count),
      lastSyncAt: eventsResult.rows[0].last_sync_ms
        ? new Date(Number(eventsResult.rows[0].last_sync_ms)).toISOString()
        : null,
    }
  })

  // ── Mudar plano de uma empresa ────────────────────────────────────────────────

  fastify.patch('/admin/companies/:companyId/plan', { preHandler: requireAdmin }, async (request, reply) => {
    const { companyId } = request.params
    const { plan } = request.body ?? {}

    if (!plan) {
      return reply.code(400).send({ error: 'plan_required' })
    }

    try {
      const updated = await subscriptionStore.updatePlan(companyId, plan)
      if (!updated) {
        return reply.code(404).send({ error: 'empresa_nao_encontrada' })
      }
      return updated
    } catch (err) {
      return reply.code(400).send({ error: err.message })
    }
  })

  // ── Listar usuários ───────────────────────────────────────────────────────────

  fastify.get('/admin/users', { preHandler: requireAdmin }, async (request) => {
    const { page = 1, limit = 20 } = request.query ?? {}
    const offset = (Number(page) - 1) * Number(limit)

    const [usersResult, countResult] = await Promise.all([
      pool.query(
        `SELECT
           u.id, u.email, u.name, u.is_admin, u.created_at,
           COUNT(cm.id) FILTER (WHERE cm.status = 'active') AS company_count
         FROM users u
         LEFT JOIN company_memberships cm ON cm.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [Number(limit), offset]
      ),
      pool.query('SELECT COUNT(*) AS total FROM users'),
    ])

    return {
      users: usersResult.rows,
      total: Number(countResult.rows[0].total),
      page: Number(page),
      limit: Number(limit),
    }
  })
}

export { adminRoutes }
