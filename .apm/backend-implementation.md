---
title: Backend Implementation Guide - Node.js + PostgreSQL
created: May 20, 2026
---

# Backend Implementation Guide

## Technology Stack

- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Fastify (lightweight, high-performance)
- **ORM**: Prisma (type-safe, migrations included)
- **Database**: PostgreSQL 15+ (event store + projections)
- **Validation**: Zod (runtime type safety)
- **Testing**: Vitest + Supertest
- **Deployment**: Docker + Railway/Render

---

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Fastify app setup
│   ├── config.ts               # Environment variables
│   ├── db/
│   │   ├── schema.prisma       # Prisma schema (auto-generated migrations)
│   │   └── seed.ts             # Initial data
│   ├── modules/
│   │   ├── sync/
│   │   │   ├── controller.ts   # POST /sync/push, GET /sync/pull
│   │   │   ├── service.ts      # Sync logic, conflict resolution
│   │   │   ├── event.ts        # Event store operations
│   │   │   └── types.ts        # TypeScript interfaces
│   │   ├── companies/
│   │   │   ├── controller.ts
│   │   │   └── service.ts
│   │   ├── launches/
│   │   │   ├── controller.ts
│   │   │   └── service.ts
│   │   ├── export/
│   │   │   ├── controller.ts   # GET /backup, POST /restore
│   │   │   └── service.ts
│   │   └── health/
│   │       └── controller.ts   # GET /health, readiness probes
│   ├── middleware/
│   │   ├── logger.ts           # Request logging
│   │   ├── errorHandler.ts     # Global error handling
│   │   └── cors.ts             # CORS for frontend
│   └── utils/
│       ├── uuid.ts             # UUID generation
│       └── pagination.ts       # Sync cursors
├── tests/
│   ├── sync.test.ts
│   ├── conflict-resolution.test.ts
│   └── fixtures/
├── prisma/
│   ├── migrations/             # Auto-generated
│   └── schema.prisma
├── docker-compose.yml          # Local PostgreSQL + backend
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Database Schema (Prisma)

```prisma
// Events (immutable audit log)
model Event {
  id               String   @id @default(cuid())
  aggregateId      String
  aggregateType    String   // "company", "launchEntry", "monthStatus"
  timestamp        BigInt
  deviceId         String
  userId           String?
  eventType        String   // "created", "updated", "deleted", "statusChanged"
  eventVersion     Int      @default(1)
  payload          Json     // JSONB flexible structure
  reason           String?
  syncedAt         BigInt?
  
  createdAt        DateTime @default(now())
  
  @@index([aggregateId, timestamp])
  @@index([timestamp])
  @@index([aggregateType])
  @@index([deviceId])
}

// Projections (rebuilt from events)
model Company {
  id               String   @id
  name             String
  type             String   // "MEI", "PJ"
  cnpj             String?
  createdAt        BigInt
  deletedAt        BigInt?
  
  launches         LaunchEntry[]
  monthStatuses    MonthStatus[]
  
  updatedAt        DateTime @updatedAt
}

model LaunchEntry {
  id               String   @id
  companyId        String
  company          Company  @relation(fields: [companyId], references: [id])
  month            String   // "2026-05"
  costType         String   // "company", "personal"
  description      String
  amount           Decimal
  category         String
  createdAt        BigInt
  updatedAt        BigInt
  deletedAt        BigInt?
  
  @@index([companyId, month])
  @@index([createdAt])
}

model MonthStatus {
  id               String   @id // "${companyId}:${month}"
  companyId        String
  company          Company  @relation(fields: [companyId], references: [id])
  month            String
  status           String   // "open", "inReview", "closed"
  statusChangedAt  BigInt
  approvedBy       String?
  approvedAt       BigInt?
  deletedAt        BigInt?
  
  @@unique([companyId, month])
  @@index([companyId])
}

model SyncMetadata {
  deviceId         String   @id
  lastSyncAt       BigInt?
  lastEventIdSynced String?
  
  updatedAt        DateTime @updatedAt
}

model Backup {
  id               String   @id @default(cuid())
  exportedAt       BigInt
  version          String   @default("1.0")
  data             Json     // Full export structure
  metadata         Json     // Counts, time range, etc.
  
  createdAt        DateTime @default(now())
  @@index([exportedAt])
}
```

---

## Core Endpoints

### Sync Endpoints

#### POST /api/sync/push
**Push local events to server**

Request:
```json
{
  "deviceId": "desktop-abc-123",
  "since": 1234567890,
  "events": [
    {
      "id": "evt-001",
      "aggregateId": "company-1",
      "aggregateType": "launchEntry",
      "timestamp": 1234567900,
      "eventType": "created",
      "eventVersion": 1,
      "payload": {
        "description": "Office supplies",
        "amount": 250.50
      },
      "reason": "manual"
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "accepted": ["evt-001"],
  "conflicts": [],
  "serverTime": 1234567950
}
```

#### GET /api/sync/pull?since=1234567890
**Pull server changes since last sync**

Response:
```json
{
  "events": [
    {
      "id": "server-evt-001",
      "aggregateId": "company-1",
      "aggregateType": "launchEntry",
      "timestamp": 1234567920,
      "eventType": "updated",
      "eventVersion": 1,
      "payload": { "amount": 300.00 },
      "deviceId": "desktop-xyz",
      "syncedAt": 1234567925
    }
  ],
  "serverTime": 1234567950,
  "hasMore": false
}
```

### Backup Endpoints

#### GET /api/backup?since=1234567890
**Export events for backup**

Response:
```json
{
  "exportedAt": 1234567950,
  "version": "1.0",
  "user": { "companies": ["company-1", "company-2"] },
  "data": {
    "events": [...],
    "companies": [...],
    "launchEntries": [...]
  },
  "metadata": {
    "totalEvents": 5000,
    "timeRange": { "earliest": 1000000000, "latest": 1234567950 }
  }
}
```

#### POST /api/restore
**Restore from backup**

Request:
```json
{
  "backup": { /* full backup JSON */ }
}
```

Response:
```json
{
  "success": true,
  "eventsImported": 5000,
  "timestamp": 1234567960
}
```

### Health & Metrics

#### GET /health
**Basic health check**

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-20T14:30:00Z"
}
```

#### GET /ready
**Readiness probe (for Kubernetes)**

Response:
```json
{
  "ready": true,
  "database": "connected",
  "uptime": 3600
}
```

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)

1. **Project Setup**
   - `npm init -y && npm install fastify prisma zod dotenv`
   - Create directory structure
   - Set up tsconfig.json
   - Configure Fastify app factory

2. **Database**
   - Create Prisma schema (events, projections)
   - Run migrations
   - Set up connection pooling (default 20 connections)

3. **Event Store**
   - Implement `createEvent()` function
   - Implement `appendEvent()` (atomic write to DB)
   - Implement `listEventsSince()` (with pagination)

### Phase 2: Sync Protocol (Days 3-4)

1. **Sync Service**
   - Implement conflict detection (same aggregate, different timestamp)
   - Implement merge logic (last-write-wins by timestamp + deviceId tiebreak)
   - Implement sync metadata tracking (lastSyncAt, pendingEvents)

2. **Controllers**
   - POST /api/sync/push (receive events, validate, merge)
   - GET /api/sync/pull (serve events since cursor)
   - Error handling (malformed payloads, schema mismatches)

3. **Testing**
   - Sync when online
   - Sync after offline period
   - Conflict resolution (two writes to same entity)
   - Idempotency (duplicate events should not be double-counted)

### Phase 3: Projections & Queries (Days 5-6)

1. **Projection Engine**
   - Rebuild `Company` from events
   - Rebuild `LaunchEntry` from events
   - Rebuild `MonthStatus` from events
   - Handle deletions (soft delete via `deletedAt`)

2. **Query Endpoints** (future, not MVP)
   - GET /api/companies
   - GET /api/companies/:id/launches?month=2026-05
   - GET /api/companies/:id/month-status?month=2026-05

3. **Consistency**
   - All projections must be derivable from events
   - No direct writes to projection tables (only via events)

### Phase 4: Backup & Restore (Day 7)

1. **Export**
   - GET /api/backup → Stream full event log + projections as JSON

2. **Import**
   - POST /api/restore → Accept JSON, replay events into DB

3. **Validation**
   - Checksum validation (hash of events)
   - Timestamp ordering (events are monotonically increasing)

### Phase 5: Deployment (Day 8)

1. **Docker**
   - Dockerfile (multi-stage, ~150 MB image)
   - docker-compose.yml (backend + PostgreSQL)

2. **Railway/Render**
   - Provision PostgreSQL
   - Deploy backend
   - Set environment variables (.env)
   - Configure health checks

3. **Monitoring**
   - Log sync operations (Fastify default logger)
   - Track event throughput
   - Monitor DB connections

---

## Sample Fastify App (Skeleton)

```typescript
// src/main.ts
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import syncController from './modules/sync/controller';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// Register plugins
fastify.register(require('@fastify/cors'));

// Routes
fastify.post('/api/sync/push', syncController.push);
fastify.get('/api/sync/pull', syncController.pull);
fastify.get('/api/backup', backupController.export);
fastify.post('/api/restore', backupController.import);
fastify.get('/health', async () => ({ status: 'ok' }));

// Start
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://0.0.0.0:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

---

## Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/empresa_facil
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

---

## Deployment Checklist

- [ ] Prisma migrations run on startup
- [ ] PostgreSQL connection pooling configured (20+ connections)
- [ ] CORS properly scoped to frontend origin
- [ ] Error handling returns 400/409/500 with clear messages
- [ ] Sync endpoints are idempotent (same request = same result)
- [ ] Health checks respond in < 100ms
- [ ] Backup endpoint supports pagination (limit + offset)
- [ ] All timestamps in UTC milliseconds (BigInt)
- [ ] Database indexes created for event queries
- [ ] Secrets not logged (avoid logging full events with PII)

---

## Integration with Frontend

**Frontend will call:**

1. **On app load**: `GET /api/sync/pull?since=lastSyncAt`
   - Receive server changes, merge into IndexedDB
   - Update `SyncMetadata.lastSyncAt`

2. **When user creates entry**: Queue locally in IndexedDB
   - When online: `POST /api/sync/push { events: [...] }`
   - If accepted: Mark events as synced

3. **Every 5 minutes** (or on network change):
   - Auto-push pending events
   - Auto-pull server changes

4. **On month close**: `POST /api/sync/push { events: [statusChangeEvent] }`
   - Mark month as "closed" server-side
   - Subsequent edits fail locally (month is protected)

---

## Next Steps

1. **Create `backend/` directory** in root
2. **Initialize Node.js project** with dependencies
3. **Set up Prisma schema** matching the design above
4. **Implement Phase 1** (event store foundation)
5. **Integrate with frontend** sync layer (Task 1.2 Frontend)
6. **Deploy to Railway** for MVP testing
