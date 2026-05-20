import dotenv from "dotenv";

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadConfig() {
  return {
    port: toNumber(process.env.PORT, 3333),
    host: process.env.HOST || "0.0.0.0",
    databaseUrl: process.env.DATABASE_URL || "",
    syncPullLimit: toNumber(process.env.SYNC_PULL_LIMIT, 500),
  };
}

export { loadConfig };
