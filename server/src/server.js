import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { createDbPool } from "./db.js";
import { runMigrations } from "./migrations.js";
import { EventStore } from "./eventStore.js";
import { UserStore } from "./userStore.js";
import { MembershipStore } from "./membershipStore.js";
import { MagicLinkStore } from "./magicLinkStore.js";
import { SubscriptionStore } from "./subscriptionStore.js";
import { EmailService } from "./emailService.js";
import { buildApp } from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const config = loadConfig();
  const pool = createDbPool(config.databaseUrl);

  const migrationClient = await pool.connect();
  try {
    await runMigrations({
      client: migrationClient,
      migrationsDir: path.resolve(__dirname, "../migrations"),
    });
  } finally {
    migrationClient.release();
  }

  const eventStore = new EventStore({ pool });
  const userStore = new UserStore({ pool });
  const membershipStore = new MembershipStore({ pool });
  const magicLinkStore = new MagicLinkStore({ pool });
  const subscriptionStore = new SubscriptionStore({ pool });
  const emailService = new EmailService({ config });

  const app = await buildApp({
    config,
    eventStore,
    userStore,
    membershipStore,
    magicLinkStore,
    subscriptionStore,
    emailService,
  });

  const close = async () => {
    await app.close();
    await pool.end();
  };

  process.on("SIGINT", close);
  process.on("SIGTERM", close);

  await app.listen({ port: config.port, host: config.host });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
