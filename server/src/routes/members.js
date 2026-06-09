import { requireAuth } from '../authMiddleware.js'

const VALID_INVITE_ROLES = ['member', 'accountant']

async function membersRoutes(fastify) {
  const { userStore, membershipStore, magicLinkStore, emailService, subscriptionStore, config } = fastify

  // ── Listar membros de uma empresa ────────────────────────────────────────────

  fastify.get('/api/companies/:companyId/members', { preHandler: requireAuth }, async (request, reply) => {
    const { companyId } = request.params

    const hasAccess = await membershipStore.hasAccess(request.user.userId, companyId)
    if (!hasAccess) {
      return reply.code(403).send({ error: 'acesso_negado' })
    }

    return membershipStore.listByCompany(companyId)
  })

  // ── Assinatura da empresa ─────────────────────────────────────────────────────

  fastify.get('/api/companies/:companyId/subscription', { preHandler: requireAuth }, async (request, reply) => {
    const { companyId } = request.params

    const hasAccess = await membershipStore.hasAccess(request.user.userId, companyId)
    if (!hasAccess) {
      return reply.code(403).send({ error: 'acesso_negado' })
    }

    const subscription = await subscriptionStore.findOrCreateFree(companyId)
    const members = await membershipStore.listByCompany(companyId)
    const activeMemberCount = members.filter((m) => m.status === 'active').length
    const limits = subscriptionStore.getLimits(subscription)

    return {
      plan: subscription.plan,
      status: subscription.status,
      memberCount: activeMemberCount,
      maxMembers: limits.maxMembers,
      historyMonths: limits.historyMonths,
    }
  })

  // ── Convidar usuário para uma empresa ────────────────────────────────────────

  fastify.post('/api/companies/:companyId/members/invite', { preHandler: requireAuth }, async (request, reply) => {
    const { companyId } = request.params
    const { email, role = 'member' } = request.body ?? {}

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return reply.code(400).send({ error: 'email_invalido' })
    }

    if (!VALID_INVITE_ROLES.includes(role)) {
      return reply.code(400).send({ error: 'papel_invalido', valid: VALID_INVITE_ROLES })
    }

    const inviterMembership = await membershipStore.findByUserAndCompany(request.user.userId, companyId)
    if (!inviterMembership || inviterMembership.status !== 'active') {
      return reply.code(403).send({ error: 'acesso_negado' })
    }

    // Verifica limite de membros do plano
    const subscription = await subscriptionStore.findOrCreateFree(companyId)
    const currentMembers = await membershipStore.listByCompany(companyId)
    const activeMemberCount = currentMembers.filter((m) => m.status === 'active').length
    if (!subscriptionStore.canAddMember(subscription, activeMemberCount)) {
      return reply.code(402).send({
        error: 'limite_de_membros',
        plan: subscription.plan,
        limit: subscriptionStore.getLimits(subscription).maxMembers,
      })
    }

    // Se o usuário já existe e já é membro ativo, rejeitar
    const existingUser = await userStore.findByEmail(email)
    if (existingUser) {
      const existingMembership = await membershipStore.findByUserAndCompany(existingUser.id, companyId)
      if (existingMembership?.status === 'active') {
        return reply.code(409).send({ error: 'ja_e_membro' })
      }
    }

    const token = await magicLinkStore.create({
      email,
      purpose: 'invite',
      companyId,
      invitedRole: role,
      invitedBy: request.user.userId,
    })

    await emailService.sendMagicLink({
      to: email,
      token,
      purpose: 'invite',
      frontendUrl: config.frontendUrl,
    })

    return { ok: true }
  })

  // ── Revogar acesso de um membro ───────────────────────────────────────────────

  fastify.delete('/api/companies/:companyId/members/:targetUserId', { preHandler: requireAuth }, async (request, reply) => {
    const { companyId, targetUserId } = request.params

    const requesterMembership = await membershipStore.findByUserAndCompany(request.user.userId, companyId)
    if (!requesterMembership || requesterMembership.role !== 'owner' || requesterMembership.status !== 'active') {
      return reply.code(403).send({ error: 'apenas_owner_pode_revogar' })
    }

    if (targetUserId === request.user.userId) {
      return reply.code(400).send({ error: 'nao_pode_revogar_proprio_acesso' })
    }

    const revoked = await membershipStore.revoke(targetUserId, companyId)
    if (!revoked) {
      return reply.code(404).send({ error: 'membro_nao_encontrado' })
    }

    return { ok: true }
  })

  // ── Alterar papel de um membro ────────────────────────────────────────────────

  fastify.patch('/api/companies/:companyId/members/:targetUserId', { preHandler: requireAuth }, async (request, reply) => {
    const { companyId, targetUserId } = request.params
    const { role } = request.body ?? {}

    if (!VALID_INVITE_ROLES.includes(role)) {
      return reply.code(400).send({ error: 'papel_invalido', valid: VALID_INVITE_ROLES })
    }

    const requesterMembership = await membershipStore.findByUserAndCompany(request.user.userId, companyId)
    if (!requesterMembership || requesterMembership.role !== 'owner' || requesterMembership.status !== 'active') {
      return reply.code(403).send({ error: 'apenas_owner_pode_alterar_papel' })
    }

    if (targetUserId === request.user.userId) {
      return reply.code(400).send({ error: 'nao_pode_alterar_proprio_papel' })
    }

    const updated = await membershipStore.updateRole(targetUserId, companyId, role)
    if (!updated) {
      return reply.code(404).send({ error: 'membro_nao_encontrado' })
    }

    return { ok: true }
  })
}

export { membersRoutes }
