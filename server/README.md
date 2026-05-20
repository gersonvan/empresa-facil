# EmpresaFacil Sync Backend

Node.js + Fastify backend for event-sourced persistence, sync, and audit-friendly durability.

## Stack

- Node.js 20+
- Fastify
- PostgreSQL 15+
- SQL migrations (append-only event store baseline)

## Environment

Copy `.env.example` into `.env` and set values:

- `PORT`: server port (default `3333`)
- `HOST`: bind host (default `0.0.0.0`)
- `DATABASE_URL`: PostgreSQL connection string
- `SYNC_PULL_LIMIT`: maximum events returned by pull endpoint (default `500`)

## Install

```bash
cd server
npm install
```

## Migrations

```bash
npm run db:migrate
```

This creates/updates:

- `schema_migrations`
- `audit_events` (append-only event log)
- `aggregate_projection_state` (projection winner metadata)
- `device_sync_metadata` (per-device checkpoints)
- `backup_exports` (server-side export history)

## Run

```bash
npm run start
```

Dev mode:

```bash
npm run dev
```

## Endpoints

- `GET /health`
- `GET /ready`
- `POST /api/sync/push`
- `GET /api/sync/pull?since=<ms>&deviceId=<id>&limit=<n>`
- `GET /api/backup/export`

## Conflict Policy

Deterministic last-write-wins:

1. Higher event timestamp wins.
2. If timestamps tie, lexicographically greater `deviceId` wins.
3. If still tied, event id is used as final deterministic fallback.

Superseded events stay in `audit_events` for traceability; projection winner metadata tracks active winner state.

## Validation

Run tests:

```bash
npm test
```

Includes migration execution test using `pg-mem` and conflict-resolution deterministic behavior checks.
