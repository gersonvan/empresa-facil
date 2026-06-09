-- Coluna de admin no usuário (somente você, dono do sistema)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Índice eficiente para busca de eventos por usuário (pull isolado)
CREATE INDEX IF NOT EXISTS idx_audit_events_user_synced
  ON audit_events (user_id, synced_at_ms ASC, id ASC);

-- Tabela de assinaturas por empresa
CREATE TABLE IF NOT EXISTS subscriptions (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'free'
                CHECK (plan IN ('free', 'pro', 'business')),
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'trial', 'past_due', 'cancelled')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,
  trial_ends_at          TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions (company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan    ON subscriptions (plan, status);
