import { getAuthToken } from './authStore'
import { API_URL } from './config'

const DEVICE_ID_KEY = 'empresa-facil:sync:device-id'
const CHECKPOINT_KEY = 'empresa-facil:sync:checkpoint'
const QUEUE_KEY = 'empresa-facil:sync:pending-queue'
const STATUS_EVENT = 'empresa-facil:sync:status-changed'

const FLUSH_DEBOUNCE_MS = 2000
const PULL_INTERVAL_MS = 30_000

// Chaves de dados a sincronizar. Exclui preferências de dispositivo e flags derivadas.
const SYNC_KEYS = new Set([
  'empresa-facil:launch-entries:v1',
  'empresa-facil:companies:v1',
  'empresa-facil:month-lifecycle:v1',
  'empresa-facil:categories:v1',
  'empresa-facil:tax-profile:v1',
  'empresa-facil:deduction-reconciliation:v1',
  'empresa-facil:commitments:v1',
  'empresa-facil:commitments-history:v1',
  'empresa-facil:deduction-brackets:v1',
  'empresa-facil:plan-of-accounts:v1',
  'empresa-facil:import-profiles:v1',
  'empresa-facil:transaction-memory:v1',
  'empresa-facil:launch-review-history:v1',
])

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'error' | 'offline'

interface QueuedEvent {
  id: string
  aggregateId: string
  aggregateType: 'storage_snapshot'
  timestamp: number
  eventType: 'snapshot_updated'
  eventVersion: 1
  payload: { value: string | null }
}

interface RemoteEvent {
  id: string
  aggregateId: string
  aggregateType: string
  timestamp: number
  deviceId: string
  eventType: string
  eventVersion: number
  payload: { value: string | null }
  syncedAt: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function getOrCreateDeviceId(): string {
  let id = window.localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = `device-${crypto.randomUUID()}`
    window.localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

// ── SyncClient ────────────────────────────────────────────────────────────────

class SyncClient {
  private deviceId: string
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private pullTimer: ReturnType<typeof setInterval> | null = null
  private isFlushing = false
  private applyingRemote = false
  private status: SyncStatus = 'idle'
  private interceptInstalled = false

  constructor() {
    this.deviceId = getOrCreateDeviceId()
  }

  // ── Status ──────────────────────────────────────────────────────────────────

  getStatus(): SyncStatus {
    return this.status
  }

  private setStatus(next: SyncStatus): void {
    if (this.status === next) return
    this.status = next
    window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: next }))
  }

  onStatusChange(cb: (status: SyncStatus) => void): () => void {
    const handler = (e: Event) => cb((e as CustomEvent<SyncStatus>).detail)
    window.addEventListener(STATUS_EVENT, handler)
    return () => window.removeEventListener(STATUS_EVENT, handler)
  }

  // ── Queue ───────────────────────────────────────────────────────────────────

  private readQueue(): QueuedEvent[] {
    return readStorage<QueuedEvent[]>(QUEUE_KEY, [])
  }

  private writeQueue(queue: QueuedEvent[]): void {
    writeStorage(QUEUE_KEY, queue)
  }

  private enqueue(key: string, value: string | null): void {
    const queue = this.readQueue()
    // Coalesce: remove previous event for same key, keep only the latest
    const filtered = queue.filter((e) => e.aggregateId !== key)
    filtered.push({
      id: crypto.randomUUID(),
      aggregateId: key,
      aggregateType: 'storage_snapshot',
      timestamp: Date.now(),
      eventType: 'snapshot_updated',
      eventVersion: 1,
      payload: { value },
    })
    this.writeQueue(filtered)
    this.setStatus('pending')
  }

  // ── Intercept localStorage ──────────────────────────────────────────────────

  private installIntercept(): void {
    if (this.interceptInstalled) return
    this.interceptInstalled = true

    const originalSetItem = window.localStorage.setItem.bind(window.localStorage)
    const originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage)
    const client = this

    window.localStorage.setItem = function (key: string, value: string): void {
      originalSetItem(key, value)
      if (!client.applyingRemote && SYNC_KEYS.has(key)) {
        client.enqueue(key, value)
        client.scheduleFlush()
      }
    }

    window.localStorage.removeItem = function (key: string): void {
      originalRemoveItem(key)
      if (!client.applyingRemote && SYNC_KEYS.has(key)) {
        client.enqueue(key, null)
        client.scheduleFlush()
      }
    }
  }

  // ── Push ────────────────────────────────────────────────────────────────────

  private scheduleFlush(): void {
    if (this.flushTimer !== null) clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => this.flush(), FLUSH_DEBOUNCE_MS)
  }

  private async flush(): Promise<void> {
    const token = getAuthToken()
    if (!token) return

    const queue = this.readQueue()
    if (queue.length === 0) return
    if (this.isFlushing) return

    this.isFlushing = true
    this.setStatus('syncing')

    try {
      const checkpoint = readStorage<number>(CHECKPOINT_KEY, 0)
      const res = await fetch(`${API_URL}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
          since: checkpoint,
          events: queue,
        }),
      })

      if (!res.ok) {
        this.setStatus('error')
        return
      }

      const result = await res.json() as { accepted: string[]; serverTime: number }
      const accepted = new Set(result.accepted)

      // Remove accepted events from queue
      const remaining = this.readQueue().filter((e) => !accepted.has(e.id))
      this.writeQueue(remaining)

      writeStorage(CHECKPOINT_KEY, result.serverTime)
      this.setStatus(remaining.length > 0 ? 'pending' : 'idle')
    } catch {
      this.setStatus('offline')
    } finally {
      this.isFlushing = false
    }
  }

  // ── Pull ────────────────────────────────────────────────────────────────────

  async pull(): Promise<boolean> {
    const token = getAuthToken()
    if (!token) return false

    const checkpoint = readStorage<number>(CHECKPOINT_KEY, 0)

    try {
      const url = new URL(`${API_URL}/api/sync/pull`)
      url.searchParams.set('deviceId', this.deviceId)
      url.searchParams.set('since', String(checkpoint))

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) return false

      const result = await res.json() as { events: RemoteEvent[]; nextCheckpoint: number; hasMore: boolean }

      let applied = false
      const pendingKeys = new Set(this.readQueue().map((e) => e.aggregateId))

      // Group events by key, keep only the latest per key
      const latestPerKey = new Map<string, RemoteEvent>()
      for (const event of result.events) {
        if (event.aggregateType !== 'storage_snapshot') continue
        if (event.deviceId === this.deviceId) continue // skip our own events
        if (pendingKeys.has(event.aggregateId)) continue // our local version is newer
        const current = latestPerKey.get(event.aggregateId)
        if (!current || event.syncedAt > current.syncedAt) {
          latestPerKey.set(event.aggregateId, event)
        }
      }

      this.applyingRemote = true
      try {
        for (const [key, event] of latestPerKey) {
          if (!SYNC_KEYS.has(key)) continue
          const { value } = event.payload
          if (value === null) {
            window.localStorage.removeItem(key)
          } else {
            window.localStorage.setItem(key, value)
          }
          applied = true
        }
      } finally {
        this.applyingRemote = false
      }

      writeStorage(CHECKPOINT_KEY, result.nextCheckpoint)

      // If there are more pages, pull again
      if (result.hasMore) {
        await this.pull()
      }

      return applied
    } catch {
      return false
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  init(): void {
    this.installIntercept()

    // Flush on window focus (catch up on queued events)
    window.addEventListener('focus', () => this.flush())

    // Flush before unload (best-effort via keepalive fetch — suporta Authorization header)
    window.addEventListener('beforeunload', () => {
      const queue = this.readQueue()
      if (queue.length === 0) return
      const token = getAuthToken()
      if (!token) return
      const checkpoint = readStorage<number>(CHECKPOINT_KEY, 0)
      fetch(`${API_URL}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: this.deviceId, since: checkpoint, events: queue }),
        keepalive: true,
      }).catch(() => { /* best-effort */ })
    })

    // Periodic pull
    this.pullTimer = setInterval(() => {
      this.pull()
      this.flush()
    }, PULL_INTERVAL_MS)
  }

  destroy(): void {
    if (this.flushTimer !== null) clearTimeout(this.flushTimer)
    if (this.pullTimer !== null) clearInterval(this.pullTimer)
  }
}

export const syncClient = new SyncClient()
