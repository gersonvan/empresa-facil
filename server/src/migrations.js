import fs from "node:fs/promises";
import path from "node:path";

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function loadMigrationFiles(migrationsDir) {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function runMigrations({ client, migrationsDir }) {
  await ensureMigrationsTable(client);
  const files = await loadMigrationFiles(migrationsDir);

  const result = {
    applied: [],
    skipped: [],
  };

  for (const fileName of files) {
    const exists = await client.query(
      "SELECT 1 FROM schema_migrations WHERE name = $1",
      [fileName]
    );

    if (exists.rowCount > 0) {
      result.skipped.push(fileName);
      continue;
    }

    const filePath = path.join(migrationsDir, fileName);
    const sql = await fs.readFile(filePath, "utf8");

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (name) VALUES ($1)",
        [fileName]
      );
      await client.query("COMMIT");
      result.applied.push(fileName);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  return result;
}

export { runMigrations };
