import { Pool } from "pg";

function createDbPool(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to start the sync server.");
  }

  const allowUnverifiedSsl =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false";

  if (allowUnverifiedSsl) {
    const url = new URL(databaseUrl);

    return new Pool({
      host: url.hostname,
      port: Number(url.port || 5432),
      database: url.pathname.slice(1),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: { rejectUnauthorized: false },
    });
  }

  return new Pool({ connectionString: databaseUrl });
}

async function checkDatabase(pool) {
  await pool.query("SELECT 1");
}

export { createDbPool, checkDatabase };
