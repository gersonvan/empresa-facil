import { Pool } from "pg";

function createDbPool(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to start the sync server.");
  }

  return new Pool({ connectionString: databaseUrl });
}

async function checkDatabase(pool) {
  await pool.query("SELECT 1");
}

export { createDbPool, checkDatabase };
