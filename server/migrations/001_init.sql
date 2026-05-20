CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  event_timestamp_ms BIGINT NOT NULL,
  device_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  reason TEXT,
  user_id TEXT,
  synced_at_ms BIGINT NOT NULL,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_aggregate_time
  ON audit_events (aggregate_id, aggregate_type, event_timestamp_ms DESC, device_id DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_synced
  ON audit_events (synced_at_ms, id);

CREATE TABLE IF NOT EXISTS aggregate_projection_state (
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  winner_event_id TEXT NOT NULL REFERENCES audit_events(id),
  winner_timestamp_ms BIGINT NOT NULL,
  winner_device_id TEXT NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (aggregate_id, aggregate_type)
);

CREATE TABLE IF NOT EXISTS device_sync_metadata (
  device_id TEXT PRIMARY KEY,
  last_sync_checkpoint_ms BIGINT NOT NULL DEFAULT 0,
  last_event_id TEXT,
  last_push_at TIMESTAMPTZ,
  last_pull_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS backup_exports (
  id TEXT PRIMARY KEY,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
