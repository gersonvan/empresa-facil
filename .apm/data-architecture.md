---
title: Data Architecture - EmpresaFacil
created: May 20, 2026
---

# Data Architecture for Multi-User, Offline-First System

## Context

- **Users**: ~100 initially
- **Companies per user**: Up to 5
- **Records per month**: Up to 1000
- **Requirements**: Offline-first, multi-device sync, backup, audit trail, LGPD/fiscal compliance, infrastructure-agnostic

## Design Principles

1. **Offline-first**: All data writes work locally without network; sync is best-effort
2. **Append-only events**: All changes recorded as immutable events for auditability
3. **Last-write-wins with causality**: Conflict resolution via timestamp + device ID
4. **Agnóstic backend**: Frontend doesn't depend on a specific server; sync can target any HTTP endpoint
5. **Local encryption ready**: Sensitive data can be encrypted at rest (future)
6. **Audit trail**: Every mutation traces user, timestamp, change, and reason

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│ Frontend (Browser / React + TypeScript)             │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ IndexedDB (Primary Local Store)               │  │
│  │ - Launch entries, companies, month status    │  │
│  │ - Event log (immutable audit trail)          │  │
│  │ - Sync metadata (last sync, pending ops)     │  │
│  └───────────────────────────────────────────────┘  │
│                      ↓                              │
│  ┌───────────────────────────────────────────────┐  │
│  │ Sync Engine                                   │  │
│  │ - Detect local changes                       │  │
│  │ - Queue updates if offline                   │  │
│  │ - POST to backend when online                │  │
│  │ - Merge incoming changes (pull)              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
          ↓ (HTTPS POST/GET)          ↑ (HTTPS pull)
┌─────────────────────────────────────────────────────┐
│ Backend (Node.js 20 LTS + Fastify)                  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Fastify HTTP Server                           │  │
│  │ - POST /api/sync/push (receive events)       │  │
│  │ - GET /api/sync/pull (serve changes)         │  │
│  │ - GET/POST /api/backup (export/restore)      │  │
│  │ - GET /health, /ready (monitoring)           │  │
│  └───────────────────────────────────────────────┘  │
│                      ↓                              │
│  ┌───────────────────────────────────────────────┐  │
│  │ Prisma ORM + PostgreSQL 15+                  │  │
│  │ - Events (immutable append-only log)         │  │
│  │ - Projections (companies, launches, status)  │  │
│  │ - SyncMetadata (device tracking)             │  │
│  │ - Backups (point-in-time exports)            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Data Model: Event-Sourced Foundation

Instead of storing raw entities, store **immutable events** that drive the state. This enables:
- Full audit trail with zero loss
- Deterministic rebuilding of state
- Conflict resolution via logical ordering
- Easy backups and point-in-time recovery

### Core Entities

#### Event (Immutable Audit Log)
```typescript
interface AuditEvent {
  id: string                    // UUID, global unique
  aggregateId: string           // Entity ID (company, launch entry, month, etc.)
  aggregateType: string         // "company" | "launchEntry" | "monthStatus" | ...
  timestamp: number             // Milliseconds since epoch
  deviceId: string              // Which device created this event
  userId?: string               // User context (optional for now; for auth layer)
  eventType: string             // "created" | "updated" | "deleted" | "statusChanged"
  eventVersion: number          // 1 (for schema evolution)
  payload: Record<string, any>  // The actual change
  reason?: string               // Why (e.g., "import", "manual entry", "correction")
  syncedAt?: number             // Server received at this time
}
```

#### SyncMetadata (Tracks Sync State)
```typescript
interface SyncMetadata {
  deviceId: string              // Unique device identifier
  lastSyncAt: number            // When we last synced with backend
  lastEventIdSynced: string     // Last event we confirmed on server
  pendingEvents: string[]       // Local IDs of events awaiting sync
}
```

### Reference Entities (Rebuilt from Events)

These are **projections** of events; they can be rebuilt anytime.

```typescript
interface Company {
  id: string
  name: string
  type: "MEI" | "PJ"
  cnpj?: string
  createdAt: number
  deletedAt?: number
}

interface LaunchEntry {
  id: string
  companyId: string
  month: string
  costType: "company" | "personal"
  description: string
  amount: number
  category: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
  editHistory: Array<{ changedAt: number; previousAmount?: number; reason?: string }>
}

interface MonthStatus {
  id: string  // "${companyId}:${month}"
  companyId: string
  month: string
  status: "open" | "inReview" | "closed"
  statusChangedAt: number
  approvedBy?: string
  approvedAt?: number
  deletedAt?: number
}
```

---

## IndexedDB Schema

### Object Stores

1. **`events`** (Primary audit log)
   - Key: `id` (UUID)
   - Index: `(aggregateId, timestamp)` for range queries
   - Index: `timestamp` for sync checkpoints
   - Index: `aggregateType` for filtering

2. **`companies`** (Projection, rebuilt from events)
   - Key: `id`
   - Index: `createdAt`

3. **`launchEntries`** (Projection)
   - Key: `id`
   - Index: `(companyId, month)` for monthly queries
   - Index: `createdAt`

4. **`monthStatuses`** (Projection)
   - Key: `id` (composite: `${companyId}:${month}`)
   - Index: `companyId`

5. **`syncMetadata`** (Sync state)
   - Key: `deviceId`
   - Stores: lastSyncAt, lastEventIdSynced, pendingEventIds

6. **`backup`** (Point-in-time snapshots)
   - Key: `timestamp`
   - Stores: Full export for recovery

---

## Sync Protocol

### Phase 1: Push (Send Local Changes)

**Request:**
```json
POST /api/sync/push
{
  "deviceId": "device-uuid",
  "since": 1234567890,
  "events": [
    {
      "id": "event-uuid",
      "aggregateId": "company-1",
      "aggregateType": "launchEntry",
      "timestamp": 1234567900,
      "eventType": "created",
      "payload": { "description": "...", "amount": 500 },
      "reason": "manual"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "accepted": ["event-uuid-1", "event-uuid-2"],
  "conflicts": [],
  "serverTime": 1234567950
}
```

### Phase 2: Pull (Receive Server Changes)

**Request:**
```json
GET /api/sync/pull?since=1234567890&deviceId=device-uuid
```

**Response:**
```json
{
  "events": [
    {
      "id": "server-event-uuid",
      "aggregateId": "...",
      "timestamp": 1234567920,
      ...
    }
  ],
  "serverTime": 1234567950,
  "hasMore": false
}
```

### Phase 3: Merge (Apply Server Changes Locally)

1. Fetch all server events since last sync
2. Replay them into local projection stores
3. Detect conflicts (two writes to same entity with different timestamps/sources)
4. Resolve via: last-write-wins by timestamp, break ties with deviceId lexicographic order
5. Update `syncMetadata.lastSyncAt`

---

## Audit Trail Example

**User action**: Edit a launch entry amount from 500 to 600

**Events generated**:
```json
[
  {
    "id": "evt-001",
    "aggregateId": "launch-1",
    "aggregateType": "launchEntry",
    "timestamp": 1234567900,
    "deviceId": "desktop-abc",
    "eventType": "updated",
    "eventVersion": 1,
    "payload": {
      "amount": 600,
      "previousAmount": 500
    },
    "reason": "correction",
    "syncedAt": 1234567920
  }
]
```

**Audit trail output** (for accountant review):
```
Launch Entry #launch-1
  Created: 2026-05-15 10:00 UTC by device desktop-abc
    Description: "Supplier invoice"
    Amount: 500.00 BRL

  Updated: 2026-05-20 14:30 UTC by device desktop-abc
    Changed: Amount 500 → 600
    Reason: correction
    Synced to backend: 2026-05-20 14:35

  Status: Synced (last change 2 hours ago)
```

---

## Conflict Resolution Strategy

**Scenario**: User edits entry on phone, then on desktop, both offline.

1. **Phone creates event**: `{id: "e1", timestamp: 1000, deviceId: "phone", amount: 600}`
2. **Desktop creates event**: `{id: "e2", timestamp: 1001, deviceId: "desktop", amount: 700}`
3. **Both sync to backend** (backend receives both)
4. **Resolution**: timestamp wins → `amount: 700` (desktop, t=1001)
5. **Sync back to phone**: Pull includes `e2`, merges to `amount: 700`
6. **Result**: Both devices converge to 700; event `e1` is preserved in audit log with notation "superseded by e2"

---

## Backup & Export

### Auto-Backup (Weekly)
```typescript
interface BackupExport {
  exportedAt: number
  version: "1.0"
  user?: { id?: string; companies: string[] }
  data: {
    events: AuditEvent[]
    companies: Company[]
    launchEntries: LaunchEntry[]
    monthStatuses: MonthStatus[]
  }
  metadata: {
    totalEvents: number
    timeRange: { earliest: number; latest: number }
    deviceIds: string[]
  }
}
```

### Recovery Path
1. Export backup from one device → JSON file
2. Import on new device → Replay all events into fresh IndexedDB
3. Sync with backend → Catchup on any server-side changes
4. All history and audit trail preserved

---

## Migration Path (from localStorage → IndexedDB + Backend)

### Step 1: Dual-write (Immediate, backward compatible)
- Keep existing localStorage writes
- Simultaneously write events to IndexedDB
- Frontend reads from IndexedDB (with fallback to localStorage)

### Step 2: Sync with backend (Once backend is ready)
- IndexedDB syncs with backend on a schedule or on-demand
- Backend stores events in database
- localStorage eventually retired

### Step 3: Multi-device sync (Once devices are in use)
- Pull latest changes from backend on app open
- Detect offline changes, queue for sync
- Full offline support

---

## Implementation Roadmap

| Phase | Task | Owner | Duration | Status |
|-------|------|-------|----------|--------|
| Phase 1 | IndexedDB schema + event write API | Application Agent | 1-2 days | Planned |
| Phase 2 | Event projection (rebuild entities from events) | Application Agent | 1-2 days | Planned |
| Phase 3 | Sync protocol + Node.js backend APIs (Fastify + Prisma) | Application Agent | 2-3 days | Planned |
| Phase 4 | Conflict resolution + merge | Application Agent | 1-2 days | Planned |
| Phase 5 | Backup/export + import | Application Agent | 1 day | Planned |
| Phase 6 | Audit trail UI (view change history) | UX/UI Agent | 1 day | Planned |

**Backend Stack**: Node.js 20 LTS + Fastify + PostgreSQL 15 + Prisma  
**Deployment**: Docker + Railway/Render  
**See also**: [Backend Implementation Guide](./backend-implementation.md)

---

## Key Advantages

✅ **Offline-first**: Works without network; no data loss  
✅ **Audit trail**: Every change recorded; LGPD-compliant  
✅ **Agnóstic**: Backend can be any HTTP server  
✅ **Multi-device**: Automatic sync across phones, tablets, desktop  
✅ **Scalable**: Event log grows linearly; projections can be cached  
✅ **Recoverable**: Full backup/restore from export  
✅ **Conflict-safe**: Deterministic merge without silent loss  

---

## Open Questions

1. **User authentication**: Currently omitted (MVP assumes single user per browser). When adding auth:
   - Add `userId` to events
   - Filter synced events by user/company permissions
   - Implement device registration flow

2. **Encryption**: For future LGPD compliance, encrypt event payloads at rest and in transit.

3. **Event versioning**: If event schema changes, how do we evolve? (Event upcasting pattern)

4. **Server-side cascade**: If a month is closed on the server, how do we prevent edits on offline devices?
   - Solution: Pull server state first, check closure before allowing writes

5. **Quota management**: IndexedDB quota per origin (~50MB). What's the retention policy?
   - Option: Archive old months, compress events, or implement tiered storage
