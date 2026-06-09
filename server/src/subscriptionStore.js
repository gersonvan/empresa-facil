import { randomUUID } from 'node:crypto'

/** Limites por plano. null = sem limite. */
const PLAN_LIMITS = {
  free:     { maxMembers: 1,    historyMonths: 3,    maxCompanies: 1 },
  pro:      { maxMembers: 3,    historyMonths: null,  maxCompanies: 1 },
  business: { maxMembers: null, historyMonths: null,  maxCompanies: null },
}

class SubscriptionStore {
  constructor({ pool }) {
    this.pool = pool
  }

  /** Retorna assinatura da empresa ou null. */
  async getByCompany(companyId) {
    const result = await this.pool.query(
      'SELECT * FROM subscriptions WHERE company_id = $1',
      [companyId]
    )
    return result.rows[0] ?? null
  }

  /**
   * Garante que a empresa tem uma assinatura free.
   * Idempotente: retorna a existente se já houver.
   */
  async findOrCreateFree(companyId) {
    const existing = await this.getByCompany(companyId)
    if (existing) return existing

    const result = await this.pool.query(
      `INSERT INTO subscriptions (id, company_id, plan, status)
       VALUES ($1, $2, 'free', 'active')
       RETURNING *`,
      [randomUUID(), companyId]
    )
    return result.rows[0]
  }

  /**
   * Muda o plano de uma empresa (uso administrativo).
   */
  async updatePlan(companyId, plan) {
    if (!PLAN_LIMITS[plan]) throw new Error(`Plano inválido: ${plan}`)

    const result = await this.pool.query(
      `UPDATE subscriptions
       SET plan = $1, updated_at = NOW()
       WHERE company_id = $2
       RETURNING *`,
      [plan, companyId]
    )
    return result.rows[0] ?? null
  }

  /**
   * Verifica se a empresa pode adicionar mais membros.
   * Recebe o número atual de membros ativos.
   */
  canAddMember(subscription, currentMemberCount) {
    const limits = PLAN_LIMITS[subscription?.plan ?? 'free']
    if (limits.maxMembers === null) return true
    return currentMemberCount < limits.maxMembers
  }

  /**
   * Retorna os limites do plano atual da empresa.
   */
  getLimits(subscription) {
    return PLAN_LIMITS[subscription?.plan ?? 'free']
  }

  /**
   * Salva o stripe_customer_id (chamado após criar checkout session).
   */
  async setStripeCustomer(companyId, stripeCustomerId) {
    if (!stripeCustomerId) return
    await this.pool.query(
      `UPDATE subscriptions
       SET stripe_customer_id = $1, updated_at = NOW()
       WHERE company_id = $2`,
      [stripeCustomerId, companyId]
    )
  }

  /**
   * Atualiza campos Stripe após checkout.session.completed.
   */
  async setStripeSubscription(companyId, { stripeCustomerId, stripeSubscriptionId, status }) {
    await this.pool.query(
      `UPDATE subscriptions
       SET stripe_customer_id = COALESCE($1, stripe_customer_id),
           stripe_subscription_id = $2,
           status = $3,
           updated_at = NOW()
       WHERE company_id = $4`,
      [stripeCustomerId, stripeSubscriptionId, status, companyId]
    )
  }

  /**
   * Atualiza o status e o período atual.
   */
  async updateStatus(companyId, status, currentPeriodEnd) {
    await this.pool.query(
      `UPDATE subscriptions
       SET status = $1,
           current_period_end = $2,
           updated_at = NOW()
       WHERE company_id = $3`,
      [status, currentPeriodEnd, companyId]
    )
  }

  /**
   * Encontra o companyId a partir do stripe_customer_id.
   * Usado nos webhooks.
   */
  async findCompanyByStripeCustomer(stripeCustomerId) {
    if (!stripeCustomerId) return null
    const result = await this.pool.query(
      'SELECT company_id FROM subscriptions WHERE stripe_customer_id = $1',
      [stripeCustomerId]
    )
    return result.rows[0]?.company_id ?? null
  }

  /** Lista todas as assinaturas (uso admin). */
  async listAll({ limit = 50, offset = 0 } = {}) {
    const result = await this.pool.query(
      `SELECT s.*, u.name AS owner_name, u.email AS owner_email
       FROM subscriptions s
       LEFT JOIN company_memberships cm
         ON cm.company_id = s.company_id AND cm.role = 'owner' AND cm.status = 'active'
       LEFT JOIN users u ON u.id = cm.user_id
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    return result.rows
  }

  /** Estatísticas agregadas para o painel admin. */
  async getStats() {
    const result = await this.pool.query(`
      SELECT
        COUNT(*)                                            AS total_companies,
        COUNT(*) FILTER (WHERE plan = 'free')               AS free_count,
        COUNT(*) FILTER (WHERE plan = 'pro')                AS pro_count,
        COUNT(*) FILTER (WHERE plan = 'business')           AS business_count,
        COUNT(*) FILTER (WHERE status = 'active')           AS active_count,
        COUNT(*) FILTER (WHERE status = 'cancelled')        AS cancelled_count
      FROM subscriptions
    `)
    return result.rows[0]
  }
}

export { SubscriptionStore, PLAN_LIMITS }
