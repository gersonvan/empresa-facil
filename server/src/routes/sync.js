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

async function syncRoutes(fastify) {
  fastify.post("/api/sync/push", async (request, reply) => {
    try {
      const payload = normalizePushBody(request.body);
      const result = await fastify.eventStore.appendEventsBatch(payload);
      return result;
    } catch (error) {
      reply.code(error.statusCode || 400);
      return {
        error: "sync_push_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  fastify.get("/api/sync/pull", async (request, reply) => {
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

    const result = await fastify.eventStore.pullEventsSince({
      since,
      deviceId,
      limit,
    });

    return result;
  });
}

export { syncRoutes };
