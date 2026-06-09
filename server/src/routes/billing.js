import Stripe from 'stripe'
import { requireAuth } from '../authMiddleware.js'

/**
 * Retorna um cliente Stripe se a chave estiver configurada.
 * Retorna null em desenvolvimento sem chave.
 */
function getStripe(secretKey) {
  if (!secretKey) return null
  return new Stripe(secretKey, { apiVersion: '2023-10-16' })
}

async function billingRoutes(fastify) {
  const { config, membershipStore, subscriptionStore } = fastify
  const stripe = getStripe(config.stripeSecretKey)

  // Lookup de priceId → plan (preenchido a partir da config)
  const planForPrice = {}
  if (config.stripePricePro) planForPrice[config.stripePricePro] = 'pro'
  if (config.stripePriceBusiness) planForPrice[config.stripePriceBusiness] = 'business'

  // ── Criar sessão de checkout ──────────────────────────────────────────────────

  fastify.post('/billing/checkout', { preHandler: requireAuth }, async (request, reply) => {
    if (!stripe) {
      return reply.code(503).send({ error: 'billing_unavailable', message: 'Stripe não configurado.' })
    }

    const { companyId, plan } = request.body ?? {}

    if (!companyId || !['pro', 'business'].includes(plan)) {
      return reply.code(400).send({ error: 'parametros_invalidos' })
    }

    // Verifica que o usuário é owner da empresa
    const membership = await membershipStore.findByUserAndCompany(request.user.userId, companyId)
    if (!membership || membership.role !== 'owner' || membership.status !== 'active') {
      return reply.code(403).send({ error: 'apenas_owner_pode_assinar' })
    }

    const priceId = plan === 'pro' ? config.stripePricePro : config.stripePriceBusiness
    if (!priceId) {
      return reply.code(503).send({ error: 'price_nao_configurado', plan })
    }

    const subscription = await subscriptionStore.findOrCreateFree(companyId)

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.frontendUrl}/members?checkout=success&companyId=${encodeURIComponent(companyId)}`,
      cancel_url: `${config.frontendUrl}/members?checkout=cancelled`,
      metadata: { companyId, plan },
      client_reference_id: companyId,
    }

    // Reutiliza o customer Stripe se já existe para pré-preencher e-mail
    if (subscription.stripe_customer_id) {
      sessionParams.customer = subscription.stripe_customer_id
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    if (session.customer) {
      await subscriptionStore.setStripeCustomer(companyId, session.customer)
    }

    return { url: session.url }
  })

  // ── Portal do cliente Stripe ──────────────────────────────────────────────────

  fastify.post('/billing/portal', { preHandler: requireAuth }, async (request, reply) => {
    if (!stripe) {
      return reply.code(503).send({ error: 'billing_unavailable', message: 'Stripe não configurado.' })
    }

    const { companyId } = request.body ?? {}
    if (!companyId) {
      return reply.code(400).send({ error: 'companyId_required' })
    }

    const membership = await membershipStore.findByUserAndCompany(request.user.userId, companyId)
    if (!membership || membership.role !== 'owner' || membership.status !== 'active') {
      return reply.code(403).send({ error: 'apenas_owner_pode_acessar_portal' })
    }

    const subscription = await subscriptionStore.getByCompany(companyId)
    if (!subscription?.stripe_customer_id) {
      return reply.code(404).send({ error: 'cliente_stripe_nao_encontrado' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${config.frontendUrl}/members`,
    })

    return { url: session.url }
  })

  // ── Webhook Stripe (escopo isolado para raw body) ─────────────────────────────
  // O Stripe exige o body RAW (Buffer) para validar a assinatura HMAC.
  // Registramos em um sub-plugin encapsulado com parser próprio.

  fastify.register(async function webhookScope(scope) {
    // Substitui o parser JSON padrão por um que retorna Buffer neste escopo
    scope.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
      done(null, body)
    })

    scope.post('/billing/webhook', async (request, reply) => {
      if (!stripe) {
        return reply.code(503).send({ error: 'billing_unavailable' })
      }

      const sig = request.headers['stripe-signature']
      let event

      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          sig,
          config.stripeWebhookSecret
        )
      } catch (err) {
        scope.log.warn({ err }, 'Stripe webhook signature verification failed')
        return reply.code(400).send({ error: 'assinatura_invalida' })
      }

      scope.log.info({ type: event.type }, 'Stripe webhook received')

      try {
        await handleStripeEvent(event, { subscriptionStore, planForPrice })
      } catch (err) {
        // Loga mas retorna 200 para evitar retry infinito do Stripe
        scope.log.error({ err, eventType: event.type }, 'Error handling Stripe event')
      }

      return { received: true }
    })
  })
}

// ── Handler de eventos Stripe ─────────────────────────────────────────────────

async function handleStripeEvent(event, { subscriptionStore, planForPrice }) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const companyId = session.metadata?.companyId
      const plan = session.metadata?.plan
      if (!companyId || !plan) break

      await subscriptionStore.updatePlan(companyId, plan)
      await subscriptionStore.setStripeSubscription(companyId, {
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        status: 'active',
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const companyId = await subscriptionStore.findCompanyByStripeCustomer(sub.customer)
      if (!companyId) break

      const priceId = sub.items?.data?.[0]?.price?.id
      const plan = planForPrice[priceId]

      const statusMap = {
        active: 'active',
        trialing: 'trial',
        past_due: 'past_due',
        canceled: 'cancelled',
        cancelled: 'cancelled',
        unpaid: 'past_due',
      }
      const mappedStatus = statusMap[sub.status] ?? 'active'
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null

      if (plan) await subscriptionStore.updatePlan(companyId, plan)
      await subscriptionStore.updateStatus(companyId, mappedStatus, periodEnd)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const companyId = await subscriptionStore.findCompanyByStripeCustomer(sub.customer)
      if (!companyId) break

      await subscriptionStore.updatePlan(companyId, 'free')
      await subscriptionStore.updateStatus(companyId, 'cancelled', null)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const companyId = await subscriptionStore.findCompanyByStripeCustomer(invoice.customer)
      if (!companyId) break

      await subscriptionStore.updateStatus(companyId, 'past_due', null)
      break
    }

    default:
      // Evento não tratado — ignorar silenciosamente
      break
  }
}

export { billingRoutes }
