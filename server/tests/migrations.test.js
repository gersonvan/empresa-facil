import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMigrations } from "../src/migrations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createFakeClient() {
  const applied = new Set();

  return {
    async query(sql, params = []) {
      if (typeof sql !== "string") {
        return { rowCount: 0, rows: [] };
      }

      if (sql.includes("SELECT 1 FROM schema_migrations")) {
        const name = params[0];
        return {
          rowCount: applied.has(name) ? 1 : 0,
          rows: applied.has(name) ? [{ one: 1 }] : [],
        };
      }

      if (sql.includes("INSERT INTO schema_migrations")) {
        applied.add(params[0]);
        return { rowCount: 1, rows: [] };
      }

      return { rowCount: 0, rows: [] };
    },
  };
}

test("runMigrations applies schema and can be re-run safely", async () => {
  const client = createFakeClient();

  const migrationsDir = path.resolve(__dirname, "../migrations");
  const resultFirst = await runMigrations({ client, migrationsDir });
  assert.ok(resultFirst.applied.includes("001_init.sql"));

  const resultSecond = await runMigrations({ client, migrationsDir });
  assert.ok(resultSecond.skipped.includes("001_init.sql"));
});
