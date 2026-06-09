import { requireAuth } from '../authMiddleware.js'
import { PLAN_LIMITS } from '../subscriptionStore.js'

function schemaValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizePushBody(body) {
  if (!body || typeof body !== "object") {
    throw schemaValidationError("Body must be a JSON object.");
  }

  if (typeof body.deviceId !== "string" || body.deviceId.trim().length === 0) {
    throw schemaValidationError("deviceId is required.");
  }

  if (!Array.isArray(body.events)) {
    throw schemaValidationError("events must be an array.");
  }

  return {
    deviceId: body.deviceId.trim(),
    since: Number.isFinite(Number(body.since)) ? Number(body.since) : 0,
    events: body.events,
  };
}

/**
 * Calcula o cutoffMs de histórico para um usuário.
 * Usa o plano mais permissivo entre todas as empresas ativas do usuário.
 * Retorna null se sem limite (pro/business), ou timestamp em ms.
 */
async function getHistoryCutoffMs(userId, { membershipStore, subscriptionStore }) {
  const memberships = await membershipStore.listByUser(userId)
  const active = memberships.filter((m) => m.status === 'active')
  if (active.length === 0) return null

  let mostPermissiveMonths = 0 // 0 = sem limite encontrado ainda

  for (const m of active) {
    const sub = await subscriptionStore.findOrCreateFree(m.company_id)
    const limits = PLAN_LIMITS[sub.plan ?? 'free']
    if (limits.historyMonths === null) return null // pro/business: sem limite
    if (limits.historyMonths > mostPermissiveMonths) {
      mostPermissiveMonths = limits.historyMonths
    }
  }

  if (mostPermissiveMonths === 0) return null

  // Início do mês mais antigo permitido
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - mostPermissiveMonths + 1, 1)
  return cutoff.getTime()
}

async function syncRoutes(fastify) {
  const { membershipStore, subscriptionStore } = fastify

  fastify.post("/api/sync/push", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const payload = normalizePushBody(request.body);
      const result = await fastify.eventStore.appendEventsBatch({
        ...payload,
        userId: request.user.userId,
      });
      return result;
    } catch (error) {
      reply.code(error.statusCode || 400);
      return {
        error: "sync_push_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  fastify.get("/api/sync/pull", { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query || {};
    const deviceId =
      typeof query.deviceId === "string" && query.deviceId.trim().length > 0
        ? query.deviceId.trim()
        : "";

    const since = Number.isFinite(Number(query.since)) ? Number(query.since) : 0;
    const limit = Number.isFinite(Number(query.limit))
      ? Number(query.limit)
      : fastify.config.syncPullLimit;

    if (!deviceId) {
      reply.code(400);
      return {
        error: "sync_pull_failed",
        message: "deviceId query parameter is required.",
      };
    }

    const cutoffMs = await getHistoryCutoffMs(request.user.userId, { membershipStore, subscriptionStore })

    const result = await fastify.eventStore.pullEventsSince({
      since,
      deviceId,
      userId: request.user.userId,
      limit,
      cutoffMs,
    });

    return result;
  });
}

export { syncRoutes };
