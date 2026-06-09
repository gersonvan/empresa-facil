async function requireAuth(request, reply) {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'unauthorized', message: 'Token inválido ou ausente.' })
  }
}

export { requireAuth }
