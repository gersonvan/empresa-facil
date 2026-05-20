import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";
import { syncRoutes } from "./routes/sync.js";
import { backupRoutes } from "./routes/backup.js";

async function buildApp({ config, eventStore }) {
  const app = Fastify({ logger: true });

  app.decorate("config", config);
  app.decorate("eventStore", eventStore);

  await app.register(cors, { origin: true });
  await app.register(healthRoutes);
  await app.register(syncRoutes);
  await app.register(backupRoutes);

  return app;
}

export { buildApp };
