import { requireAuth } from '../authMiddleware.js'

async function authRoutes(fastify) {
  const { userStore, membershipStore, magicLinkStore, emailService, config } = fastify

  // ── OAuth: Google ────────────────────────────────────────────────────────────

  if (fastify.googleOAuth2) {
    fastify.get('/auth/google/callback', async (request, reply) => {
      try {
        const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        })
        const info = await res.json()

        const user = await userStore.upsertFromOAuth({
          provider: 'google',
          providerId: info.id,
          email: info.email,
          name: info.name,
          avatarUrl: info.picture,
        })

        const jwt = fastify.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '30d' })
        return reply.redirect(`${config.frontendUrl}/auth/callback?token=${jwt}`)
      } catch (error) {
        fastify.log.error(error)
        return reply.redirect(`${config.frontendUrl}/auth/callback?error=oauth_failed`)
      }
    })
  }

  // ── OAuth: Microsoft ─────────────────────────────────────────────────────────

  if (fastify.microsoftOAuth2) {
    fastify.get('/auth/microsoft/callback', async (request, reply) => {
      try {
        const { token } = await fastify.microsoftOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
        const res = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        })
        const info = await res.json()

        const user = await userStore.upsertFromOAuth({
          provider: 'microsoft',
          providerId: info.id,
          email: info.mail ?? info.userPrincipalName,
          name: info.displayName,
          avatarUrl: null,
        })

        const jwt = fastify.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '30d' })
        return reply.redirect(`${config.frontendUrl}/auth/callback?token=${jwt}`)
      } catch (error) {
        fastify.log.error(error)
        return reply.redirect(`${config.frontendUrl}/auth/callback?error=oauth_failed`)
      }
    })
  }

  // ── Magic link: solicitar ────────────────────────────────────────────────────

  fastify.post('/auth/magic-link/request', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute', keyGenerator: (req) => req.body?.email ?? req.ip } },
  }, async (request, reply) => {
    const { email } = request.body ?? {}
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return reply.code(400).send({ error: 'email_invalido' })
    }

    const token = await magicLinkStore.create({ email, purpose: 'login' })
    await emailService.sendMagicLink({ to: email, token, purpose: 'login', frontendUrl: config.frontendUrl })

    // Resposta genérica: não revelar se o email existe ou não
    return { ok: true }
  })

  // ── Magic link: verificar ────────────────────────────────────────────────────

  fastify.get('/auth/magic-link/verify', async (request, reply) => {
    const { token } = request.query ?? {}
    if (!token) {
      return reply.redirect(`${config.frontendUrl}/auth/callback?error=token_ausente`)
    }

    const record = await magicLinkStore.verify(token)
    if (!record) {
      return reply.redirect(`${config.frontendUrl}/auth/callback?error=token_invalido`)
    }

    const user = await userStore.findOrCreateByEmail(record.email)

    if (record.purpose === 'invite' && record.company_id) {
      const existing = await membershipStore.findByUserAndCompany(user.id, record.company_id)

      if (existing) {
        await membershipStore.activate(user.id, record.company_id)
      } else {
        await membershipStore.create({
          userId: user.id,
          companyId: record.company_id,
          role: record.invited_role ?? 'member',
          invitedBy: record.invited_by,
          status: 'active',
        })
      }
    }

    const jwt = fastify.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '30d' })
    return reply.redirect(`${config.frontendUrl}/auth/callback?token=${jwt}`)
  })

  // ── Usuário autenticado atual ─────────────────────────────────────────────────

  fastify.get('/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await userStore.findById(request.user.userId)
    if (!user) {
      return reply.code(404).send({ error: 'usuario_nao_encontrado' })
    }
    const memberships = await membershipStore.listByUser(request.user.userId)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        isAdmin: user.is_admin ?? false,
        createdAt: user.created_at,
      },
      memberships,
    }
  })
}

export { authRoutes }
