import Fastify from "fastify";
import cors from "@fastify/cors";
import jwtPlugin from "@fastify/jwt";
import oauthPlugin from "@fastify/oauth2";
import { healthRoutes } from "./routes/health.js";
import { syncRoutes } from "./routes/sync.js";
import { backupRoutes } from "./routes/backup.js";
import { authRoutes } from "./routes/auth.js";
import { membersRoutes } from "./routes/members.js";

async function buildApp({ config, eventStore, userStore, membershipStore, magicLinkStore, emailService }) {
  const app = Fastify({ logger: true });

  app.decorate("config", config);
  app.decorate("eventStore", eventStore);
  app.decorate("userStore", userStore);
  app.decorate("membershipStore", membershipStore);
  app.decorate("magicLinkStore", magicLinkStore);
  app.decorate("emailService", emailService);

  await app.register(cors, { origin: true });
  await app.register(jwtPlugin, { secret: config.jwtSecret });

  if (config.googleClientId) {
    await app.register(oauthPlugin, {
      name: "googleOAuth2",
      scope: ["openid", "email", "profile"],
      credentials: {
        client: { id: config.googleClientId, secret: config.googleClientSecret },
        auth: oauthPlugin.GOOGLE_CONFIGURATION,
      },
      startRedirectPath: "/auth/google",
      callbackUri: `${config.backendUrl}/auth/google/callback`,
    });
  }

  if (config.microsoftClientId) {
    await app.register(oauthPlugin, {
      name: "microsoftOAuth2",
      scope: ["openid", "email", "profile", "User.Read"],
      credentials: {
        client: { id: config.microsoftClientId, secret: config.microsoftClientSecret },
        auth: oauthPlugin.MICROSOFT_CONFIGURATION,
      },
      startRedirectPath: "/auth/microsoft",
      callbackUri: `${config.backendUrl}/auth/microsoft/callback`,
    });
  }

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(membersRoutes);
  await app.register(syncRoutes);
  await app.register(backupRoutes);

  return app;
}

export { buildApp };
