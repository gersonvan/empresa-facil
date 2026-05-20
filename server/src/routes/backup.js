async function backupRoutes(fastify) {
  fastify.get("/api/backup/export", async () => {
    return fastify.eventStore.exportBackup();
  });
}

export { backupRoutes };
