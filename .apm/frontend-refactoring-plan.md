---
title: Frontend Task 1.2 Analysis & Refactoring Plan
created: May 20, 2026
---

# Frontend Task 1.2 - Analysis & Refactoring Plan

## Current State

### ✅ What's Good
1. **launchStore.ts**: Estrutura simples com localStorage
   - Interfaces bem definidas (`StoredLaunchEntry`)
   - Funções isoladas (saveLaunchEntry, listLaunchEntries)

2. **repository.js**: Lógica de negócio clara
   - Validação de transições de status (open → in_review → closed)
   - Proteção contra edição de meses fechados
   - Histórico de mudanças

### ❌ What Needs Fixing

**Problem 1: Sem event-sourcing**
```typescript
// Current: Direct mutation
launchEntries[index] = nextEntry;

// Needed: Append event, then project
events.append({
  aggregateId: entryId,
  eventType: 'updated',
  payload: { amount: 600 },
  timestamp: now(),
});
```

**Problem 2: Múltiplos storage backends**
- `launchStore.ts` usa localStorage
- `repository.js` usa memória volátil
- Sem coordenação entre eles

**Problem 3: Sem sincronização**
- Nenhum código que fale com backend
- Sem offline queue
- Sem merge de conflitos

**Problem 4: Sem auditoria**
- `StoredLaunchEntry` não tem `deviceId`, `reason`, `syncedAt`
- Não há forma de saber quem fez a mudança ou por quê

---

## Refactoring Strategy

### Phase 1: Migrate to Event-Sourced Architecture

**Goal**: Replace direct mutations with append-only events

```typescript
// Before (current)
export function saveLaunchEntry(entry: StoredLaunchEntry) {
  const current = readEntries()
  writeEntries([...current, entry])
}

// After (event-sourced)
export async function saveLaunchEntry(input: CreateLaunchInput) {
  const event = createEvent({
    aggregateId: generateId(),
    aggregateType: 'launchEntry',
    eventType: 'created',
    timestamp: now(),
    deviceId: getDeviceId(),
    payload: {
      companyId: input.companyId,
      month: input.month,
      costType: input.costType,
      description: input.description,
      amount: input.amount,
      category: input.category,
    },
    reason: 'manual',
  })
  
  // Write to IndexedDB (local)
  await appendEvent(event)
  
  // Queue for sync (if offline, just queue; if online, push)
  await queueForSync(event)
  
  // Rebuild projection
  await rebuildProjection('launchEntries')
  
  return event.id
}
```

### Phase 2: Switch to IndexedDB + Events

**Schema** (replaces localStorage):
```typescript
interface IndexedDBSchema {
  // Immutable audit log
  events: {
    keyPath: 'id'
    indexes: [
      { name: 'aggregateId_timestamp', keyPath: ['aggregateId', 'timestamp'] },
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'aggregateType', keyPath: 'aggregateType' },
    ]
  }
  
  // Projections (rebuild from events)
  companies: {
    keyPath: 'id'
    indexes: [{ name: 'createdAt', keyPath: 'createdAt' }]
  }
  
  launchEntries: {
    keyPath: 'id'
    indexes: [
      { name: 'companyId_month', keyPath: ['companyId', 'month'] },
      { name: 'createdAt', keyPath: 'createdAt' },
    ]
  }
  
  monthStatuses: {
    keyPath: 'id', // "${companyId}:${month}"
    indexes: [{ name: 'companyId', keyPath: 'companyId' }]
  }
  
  // Sync tracking
  syncMetadata: {
    keyPath: 'deviceId'
  }
  
  // Pending events (offline queue)
  pendingEvents: {
    keyPath: 'id'
    indexes: [{ name: 'syncedAt', keyPath: 'syncedAt' }]
  }
}
```

### Phase 3: Implement Sync Engine

**Sync Protocol**:
```typescript
// 1. Detect online/offline
onNetworkChange(async (isOnline) => {
  if (isOnline) {
    // Push pending events to backend
    const pending = await getPendingEvents()
    if (pending.length > 0) {
      await pushEvents(pending)
    }
    
    // Pull server changes
    const metadata = await getSyncMetadata()
    const serverEvents = await pullEvents({ since: metadata.lastSyncAt })
    
    // Merge and rebuild
    await mergeEvents(serverEvents)
    await rebuildAllProjections()
  }
})

// 2. Periodic sync (every 5 min when online)
setInterval(async () => {
  if (navigator.onLine) {
    await syncWithBackend()
  }
}, 5 * 60 * 1000)
```

### Phase 4: Conflict Resolution

**Scenario**: User edits entry on mobile, then on desktop (both offline).

**Solution**:
```typescript
// Desktop creates event e1: { timestamp: 1000, amount: 700 }
// Mobile creates event e2: { timestamp: 1001, amount: 600 }

// When desktop syncs: POST /api/sync/push { events: [e1] }
// Backend stores e1, returns success

// When mobile syncs: POST /api/sync/push { events: [e2] }
// Backend detects conflict (same aggregateId, different timestamp)
// Resolves: e2.timestamp > e1.timestamp → e2 wins
// Stores both but marks e1 as "superseded"

// When both pull updates:
// Both receive e2, rebuild with amount: 600
// Both converge to same state
```

---

## Concrete Implementation Steps

### Step 1: Create IndexedDB Layer (3-4 hours)

```typescript
// src/db/indexeddb.ts
export class IndexedDBStore {
  private db: IDBDatabase
  
  async init() {
    const request = indexedDB.open('empresa-facil-v2', 1)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      
      // Events store
      if (!db.objectStoreNames.contains('events')) {
        const eventsStore = db.createObjectStore('events', { keyPath: 'id' })
        eventsStore.createIndex('aggregateId_timestamp', ['aggregateId', 'timestamp'])
        eventsStore.createIndex('timestamp', 'timestamp')
        eventsStore.createIndex('aggregateType', 'aggregateType')
      }
      
      // Companies store
      if (!db.objectStoreNames.contains('companies')) {
        db.createObjectStore('companies', { keyPath: 'id' })
      }
      
      // LaunchEntries store
      if (!db.objectStoreNames.contains('launchEntries')) {
        const store = db.createObjectStore('launchEntries', { keyPath: 'id' })
        store.createIndex('companyId_month', ['companyId', 'month'])
      }
      
      // ... other stores
    }
    
    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  async appendEvent(event: AuditEvent): Promise<void> {
    const tx = this.db.transaction(['events', 'syncMetadata'], 'readwrite')
    const eventsStore = tx.objectStore('events')
    const metaStore = tx.objectStore('syncMetadata')
    
    await eventsStore.add(event)
    
    // Queue for sync (mark as pending)
    const metadata = await metaStore.get(getDeviceId())
    const pending = metadata?.pendingEventIds ?? []
    await metaStore.put({
      deviceId: getDeviceId(),
      pendingEventIds: [...pending, event.id],
      lastSyncAt: metadata?.lastSyncAt,
    })
  }
  
  async getEventsSince(timestamp: number): Promise<AuditEvent[]> {
    const store = this.db.transaction('events', 'readonly')
      .objectStore('events')
      .index('timestamp')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll(IDBKeyRange.lowerBound(timestamp))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  // ... other methods
}
```

### Step 2: Create Event Projection Engine (3-4 hours)

```typescript
// src/db/projections.ts
export async function rebuildProjectionFromEvents(type: 'launchEntries' | 'companies' | 'monthStatuses') {
  const events = await getAllEvents()
  const db = await getIndexedDB()
  
  const filtered = events.filter(e => e.aggregateType === type)
  const projections = buildProjections(filtered, type)
  
  // Clear old projections
  const store = db.transaction([type], 'readwrite').objectStore(type)
  await store.clear()
  
  // Write new projections
  for (const proj of projections) {
    await store.add(proj)
  }
}

function buildProjections(events: AuditEvent[], type: string) {
  if (type === 'launchEntries') {
    return buildLaunchEntryProjections(events)
  } else if (type === 'companies') {
    return buildCompanyProjections(events)
  } else if (type === 'monthStatuses') {
    return buildMonthStatusProjections(events)
  }
}

function buildLaunchEntryProjections(events: AuditEvent[]): LaunchEntry[] {
  const byId = new Map<string, LaunchEntry>()
  
  for (const event of events.sort((a, b) => a.timestamp - b.timestamp)) {
    const id = event.aggregateId
    
    if (event.eventType === 'created') {
      byId.set(id, {
        id,
        ...event.payload,
        createdAt: event.timestamp,
        updatedAt: event.timestamp,
      })
    } else if (event.eventType === 'updated') {
      const current = byId.get(id)
      if (current) {
        byId.set(id, {
          ...current,
          ...event.payload,
          updatedAt: event.timestamp,
        })
      }
    } else if (event.eventType === 'deleted') {
      const current = byId.get(id)
      if (current) {
        byId.set(id, {
          ...current,
          deletedAt: event.timestamp,
        })
      }
    }
  }
  
  return Array.from(byId.values())
}
```

### Step 3: Create Sync Engine (2-3 hours)

```typescript
// src/sync/engine.ts
export class SyncEngine {
  private db: IndexedDBStore
  private backendUrl: string
  
  async push(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Offline, skipping push')
      return
    }
    
    const pending = await this.db.getPendingEvents()
    if (pending.length === 0) return
    
    const response = await fetch(`${this.backendUrl}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        events: pending,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Push failed: ${response.status}`)
    }
    
    const { accepted } = await response.json()
    
    // Mark events as synced
    for (const eventId of accepted) {
      await this.db.markEventSynced(eventId)
    }
  }
  
  async pull(): Promise<void> {
    if (!navigator.onLine) return
    
    const metadata = await this.db.getSyncMetadata(getDeviceId())
    const since = metadata?.lastSyncAt ?? 0
    
    const response = await fetch(
      `${this.backendUrl}/api/sync/pull?since=${since}&deviceId=${getDeviceId()}`
    )
    
    if (!response.ok) {
      throw new Error(`Pull failed: ${response.status}`)
    }
    
    const { events, serverTime } = await response.json()
    
    // Merge into local store
    for (const event of events) {
      await this.db.appendEvent(event, { synced: true })
    }
    
    // Update sync metadata
    await this.db.updateSyncMetadata(getDeviceId(), {
      lastSyncAt: serverTime,
    })
    
    // Rebuild projections
    await rebuildAllProjections()
  }
  
  async sync(): Promise<void> {
    try {
      await this.push()
      await this.pull()
    } catch (err) {
      console.error('Sync failed', err)
    }
  }
}

// Initialize sync engine
const engine = new SyncEngine()

// Sync on online
window.addEventListener('online', () => engine.sync())

// Periodic sync
setInterval(() => engine.sync(), 5 * 60 * 1000)
```

### Step 4: Integrate with Existing Code (2-3 hours)

```typescript
// src/launchStore.ts (refactored)
import { getIndexedDB } from './db/indexeddb'
import { rebuildProjectionFromEvents } from './db/projections'

export async function saveLaunchEntry(input: CreateLaunchInput) {
  const db = await getIndexedDB()
  
  const event = {
    id: generateId(),
    aggregateId: generateId(),
    aggregateType: 'launchEntry',
    eventType: 'created',
    timestamp: Date.now(),
    deviceId: getDeviceId(),
    payload: {
      companyId: input.companyId,
      month: input.month,
      costType: input.costType,
      description: input.description,
      amount: input.amount,
      category: input.category,
    },
    reason: 'manual',
  }
  
  // Append to event store
  await db.appendEvent(event)
  
  // Rebuild projection
  await rebuildProjectionFromEvents('launchEntries')
  
  // Trigger sync if online
  if (navigator.onLine) {
    const syncEngine = getSyncEngine()
    syncEngine.push() // Don't await, do in background
  }
  
  return event.aggregateId
}

export async function listLaunchEntries(filters: ListFilters) {
  const db = await getIndexedDB()
  return db.query('launchEntries', filters)
}
```

---

## Timeline & Milestones

| Step | Task | Hours | Status |
|------|------|-------|--------|
| 1 | IndexedDB layer (schema + CRUD) | 3-4 | 🔲 To do |
| 2 | Event projection engine | 3-4 | 🔲 To do |
| 3 | Sync engine (push/pull) | 2-3 | 🔲 To do |
| 4 | Integrate with existing code | 2-3 | 🔲 To do |
| 5 | Testing (offline, conflicts, sync) | 2-3 | 🔲 To do |
| **Total** | | **12-17 hours** | |

---

## Compatibility with Backend (Task 1.6)

### Frontend Event Format

```typescript
interface AuditEvent {
  id: string
  aggregateId: string
  aggregateType: 'company' | 'launchEntry' | 'monthStatus'
  timestamp: number
  deviceId: string
  eventType: 'created' | 'updated' | 'deleted' | 'statusChanged'
  eventVersion: number
  payload: Record<string, any>
  reason?: string
  syncedAt?: number
}
```

### Backend Receives Same Format

Frontend POSTs to `POST /api/sync/push`:
```json
{
  "deviceId": "device-abc",
  "events": [
    { "id": "...", "aggregateId": "...", ... }
  ]
}
```

Backend stores directly into PostgreSQL `events` table:
```sql
INSERT INTO events (id, aggregate_id, aggregate_type, ...)
VALUES (?, ?, ?, ...)
```

### Key Point: **No translation needed**

Both frontend and backend use the **exact same event format**. The sync protocol is a simple POST/GET of these events.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| IndexedDB quota (~50MB) | Lose old data | Archive old months, compress events |
| Conflict on same aggregate | Silent data loss | Timestamp + deviceId tiebreak (deterministic) |
| Network failure mid-sync | Partial sync | Idempotent push (same event twice = OK) |
| App crash during event write | Data corruption | Use IndexedDB transactions (atomic) |

---

## Next Step

Should I start implementing Step 1 (IndexedDB layer) now?
