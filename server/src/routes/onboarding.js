import { requireAuth } from '../authMiddleware.js'

async function onboardingRoutes(fastify) {
  const { membershipStore } = fastify

  // Retorna se o usuário ainda precisa passar pelo onboarding
  fastify.get('/api/onboarding/status', { preHandler: requireAuth }, async (request) => {
    const memberships = await membershipStore.listByUser(request.user.userId)
    return { needsOnboarding: memberships.length === 0 }
  })

  // Reivindica ownership das empresas que o usuário possui localmente
  fastify.post('/api/companies/claim', { preHandler: requireAuth }, async (request, reply) => {
    const { companyIds } = request.body ?? {}

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return reply.code(400).send({ error: 'company_ids_required' })
    }

    const claimed = []
    const skipped = []

    for (const companyId of companyIds) {
      if (typeof companyId !== 'string' || !companyId.trim()) continue

      const existing = await membershipStore.findByUserAndCompany(request.user.userId, companyId.trim())

      if (existing?.status === 'active') {
        skipped.push(companyId)
        continue
      }

      // Verifica se já há outro owner — não pode "roubar" uma empresa
      const members = await membershipStore.listByCompany(companyId.trim())
      const alreadyHasOwner = members.some((m) => m.role === 'owner' && m.status === 'active')

      if (alreadyHasOwner) {
        skipped.push(companyId)
        continue
      }

      await membershipStore.create({
        userId: request.user.userId,
        companyId: companyId.trim(),
        role: 'owner',
        status: 'active',
      })

      claimed.push(companyId)
    }

    return { claimed, skipped }
  })
}

export { onboardingRoutes }
