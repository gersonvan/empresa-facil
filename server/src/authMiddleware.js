async function requireAuth(request, reply) {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'unauthorized', message: 'Token inválido ou ausente.' })
  }
}

async function requireAdmin(request, reply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.code(401).send({ error: 'unauthorized', message: 'Token inválido ou ausente.' })
  }

  // Busca is_admin direto no DB — não confia no JWT para privilégio de admin
  const result = await reply.server.userStore.findById(request.user.userId)
  if (!result?.is_admin) {
    return reply.code(403).send({ error: 'forbidden', message: 'Acesso restrito a administradores.' })
  }
}

export { requireAuth, requireAdmin }
