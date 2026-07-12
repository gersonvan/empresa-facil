import { Pool } from "pg";

function createDbPool(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to start the sync server.");
  }

  const allowUnverifiedSsl =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false";
  const connectionString = allowUnverifiedSsl
    ? (() => {
        const url = new URL(databaseUrl);
        url.searchParams.delete("sslmode");
        url.searchParams.delete("uselibpqcompat");
        return url.toString();
      })()
    : databaseUrl;

  return new Pool({
    connectionString,
    ...(allowUnverifiedSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

async function checkDatabase(pool) {
  await pool.query("SELECT 1");
}

export { createDbPool, checkDatabase };
