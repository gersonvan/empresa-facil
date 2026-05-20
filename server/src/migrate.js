import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { createDbPool } from "./db.js";
import { runMigrations } from "./migrations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const config = loadConfig();
  const pool = createDbPool(config.databaseUrl);
  const client = await pool.connect();

  try {
    const migrationsDir = path.resolve(__dirname, "../migrations");
    const result = await runMigrations({ client, migrationsDir });
    console.log("Migrations applied:", result.applied);
    console.log("Migrations skipped:", result.skipped);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
