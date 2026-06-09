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
    jwtSecret: process.env.JWT_SECRET || "dev-secret-troque-em-producao",
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    microsoftClientId: process.env.MICROSOFT_CLIENT_ID || "",
    microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
    backendUrl: process.env.BACKEND_URL || "http://localhost:3333",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: toNumber(process.env.SMTP_PORT, 587),
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    smtpFrom: process.env.SMTP_FROM || "EmpresaFácil <noreply@empresafacil.app>",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    stripePricePro: process.env.STRIPE_PRICE_PRO || "",
    stripePriceBusiness: process.env.STRIPE_PRICE_BUSINESS || "",
  };
}

export { loadConfig };
