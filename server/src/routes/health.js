async function healthRoutes(fastify) {
  fastify.get("/health", async () => {
    return {
      status: "ok",
      service: "empresa-facil-sync-server",
      uptimeSeconds: Math.round(process.uptime()),
      serverTime: Date.now(),
    };
  });

  fastify.get("/ready", async (_request, reply) => {
    try {
      await fastify.eventStore.checkReady();
      return {
        status: "ready",
        db: "up",
        serverTime: Date.now(),
      };
    } catch (error) {
      reply.code(503);
      return {
        status: "not_ready",
        db: "down",
        message: error instanceof Error ? error.message : "Unknown database error",
      };
    }
  });
}

export { healthRoutes };
