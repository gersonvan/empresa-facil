import { randomUUID } from "node:crypto";
import { classifyConflict } from "./conflict.js";

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

function toEventTimestamp(input) {
  const value = Number(input);
  if (!Number.isFinite(value)) {
    throw new Error("event.timestamp must be a finite number.");
  }

  return Math.trunc(value);
}

function validateEventPayload(rawEvent, deviceId) {
  assertNonEmptyString(rawEvent.id, "event.id");
  assertNonEmptyString(rawEvent.aggregateId, "event.aggregateId");
  assertNonEmptyString(rawEvent.aggregateType, "event.aggregateType");
  assertNonEmptyString(rawEvent.eventType, "event.eventType");

  if (typeof rawEvent.payload !== "object" || rawEvent.payload === null) {
    throw new Error("event.payload must be an object.");
  }

  const timestamp = toEventTimestamp(rawEvent.timestamp);

  return {
    id: rawEvent.id.trim(),
    aggregateId: rawEvent.aggregateId.trim(),
    aggregateType: rawEvent.aggregateType.trim(),
    timestamp,
    deviceId,
    eventType: rawEvent.eventType.trim(),
    payload: rawEvent.payload,
    reason: typeof rawEvent.reason === "string" ? rawEvent.reason : null,
    eventVersion:
      rawEvent.eventVersion === undefined || rawEvent.eventVersion === null
        ? 1
        : Number(rawEvent.eventVersion),
    userId: typeof rawEvent.userId === "string" ? rawEvent.userId : null,
  };
}

function mapWinnerRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.winner_event_id,
    eventTimestampMs: Number(row.winner_timestamp_ms),
    deviceId: row.winner_device_id,
  };
}

class EventStore {
  constructor({ pool }) {
    this.pool = pool;
  }

  async #readProjectionWinner(client, aggregateId, aggregateType) {
    const result = await client.query(
      `
        SELECT winner_event_id, winner_timestamp_ms, winner_device_id
        FROM aggregate_projection_state
        WHERE aggregate_id = $1 AND aggregate_type = $2
      `,
      [aggregateId, aggregateType]
    );

    return mapWinnerRow(result.rows[0]);
  }

  async #upsertProjectionWinner(client, event) {
    await client.query(
      `
        INSERT INTO aggregate_projection_state (
          aggregate_id,
          aggregate_type,
          winner_event_id,
          winner_timestamp_ms,
          winner_device_id,
          snapshot,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
        ON CONFLICT (aggregate_id, aggregate_type)
        DO UPDATE SET
          winner_event_id = EXCLUDED.winner_event_id,
          winner_timestamp_ms = EXCLUDED.winner_timestamp_ms,
          winner_device_id = EXCLUDED.winner_device_id,
          snapshot = EXCLUDED.snapshot,
          updated_at = NOW()
      `,
      [
        event.aggregateId,
        event.aggregateType,
        event.id,
        event.timestamp,
        event.deviceId,
        JSON.stringify(event.payload),
      ]
    );
  }

  async #touchDeviceSync(client, { deviceId, checkpoint, lastEventId, mode }) {
    const query =
      mode === "pull"
        ? `
          INSERT INTO device_sync_metadata (
            device_id,
            last_sync_checkpoint_ms,
            last_event_id,
            last_pull_at
          )
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (device_id)
          DO UPDATE SET
            last_sync_checkpoint_ms = GREATEST(device_sync_metadata.last_sync_checkpoint_ms, EXCLUDED.last_sync_checkpoint_ms),
            last_event_id = EXCLUDED.last_event_id,
            last_pull_at = NOW()
        `
        : `
          INSERT INTO device_sync_metadata (
            device_id,
            last_sync_checkpoint_ms,
            last_event_id,
            last_push_at
          )
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (device_id)
          DO UPDATE SET
            last_sync_checkpoint_ms = GREATEST(device_sync_metadata.last_sync_checkpoint_ms, EXCLUDED.last_sync_checkpoint_ms),
            last_event_id = EXCLUDED.last_event_id,
            last_push_at = NOW()
        `;

    await client.query(query, [deviceId, checkpoint, lastEventId]);
  }

  async appendEventsBatch({ deviceId, events, since = 0 }) {
    assertNonEmptyString(deviceId, "deviceId");
    if (!Array.isArray(events)) {
      throw new Error("events must be an array.");
    }

    const normalizedEvents = events.map((event) => validateEventPayload(event, deviceId));
    const accepted = [];
    const conflicts = [];

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      for (const event of normalizedEvents) {
        const syncedAtMs = Date.now();
        const insertResult = await client.query(
          `
            INSERT INTO audit_events (
              id,
              aggregate_id,
              aggregate_type,
              event_timestamp_ms,
              device_id,
              event_type,
              event_version,
              payload,
              reason,
              user_id,
              synced_at_ms
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
            ON CONFLICT (id) DO NOTHING
            RETURNING id
          `,
          [
            event.id,
            event.aggregateId,
            event.aggregateType,
            event.timestamp,
            event.deviceId,
            event.eventType,
            event.eventVersion,
            JSON.stringify(event.payload),
            event.reason,
            event.userId,
            syncedAtMs,
          ]
        );

        if (insertResult.rowCount === 0) {
          conflicts.push({
            eventId: event.id,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            reason: "duplicate_event_id",
          });
          continue;
        }

        accepted.push(event.id);

        const currentWinner = await this.#readProjectionWinner(
          client,
          event.aggregateId,
          event.aggregateType
        );

        const candidate = {
          id: event.id,
          eventTimestampMs: event.timestamp,
          deviceId: event.deviceId,
        };

        const conflictOutcome = classifyConflict(currentWinner, candidate);
        if (conflictOutcome.winner.id === candidate.id) {
          await this.#upsertProjectionWinner(client, event);
        }

        if (conflictOutcome.conflict) {
          conflicts.push({
            eventId: event.id,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            reason: conflictOutcome.reason,
            winnerEventId: conflictOutcome.winner.id,
          });
        }
      }

      const checkpoint = Date.now();
      const lastEventId = accepted.length > 0 ? accepted[accepted.length - 1] : null;
      await this.#touchDeviceSync(client, {
        deviceId,
        checkpoint: Math.max(Number(since) || 0, checkpoint),
        lastEventId,
        mode: "push",
      });

      await client.query("COMMIT");

      return {
        accepted,
        conflicts,
        serverTime: checkpoint,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async pullEventsSince({ since = 0, deviceId, limit = 500 }) {
    const normalizedSince = Number.isFinite(Number(since)) ? Number(since) : 0;
    const normalizedLimit = Math.max(1, Math.min(1000, Number(limit) || 500));

    const client = await this.pool.connect();
    try {
      const rowsResult = await client.query(
        `
          SELECT
            id,
            aggregate_id,
            aggregate_type,
            event_timestamp_ms,
            device_id,
            event_type,
            event_version,
            payload,
            reason,
            user_id,
            synced_at_ms
          FROM audit_events
          WHERE synced_at_ms > $1
          ORDER BY synced_at_ms ASC, id ASC
          LIMIT $2
        `,
        [normalizedSince, normalizedLimit + 1]
      );

      const hasMore = rowsResult.rows.length > normalizedLimit;
      const rows = hasMore ? rowsResult.rows.slice(0, normalizedLimit) : rowsResult.rows;
      const events = rows.map((row) => ({
        id: row.id,
        aggregateId: row.aggregate_id,
        aggregateType: row.aggregate_type,
        timestamp: Number(row.event_timestamp_ms),
        deviceId: row.device_id,
        eventType: row.event_type,
        eventVersion: row.event_version,
        payload: row.payload,
        reason: row.reason,
        userId: row.user_id,
        syncedAt: Number(row.synced_at_ms),
      }));

      const nextCheckpoint =
        events.length > 0 ? events[events.length - 1].syncedAt : normalizedSince;

      if (deviceId) {
        await this.#touchDeviceSync(client, {
          deviceId,
          checkpoint: nextCheckpoint,
          lastEventId: events.length > 0 ? events[events.length - 1].id : null,
          mode: "pull",
        });
      }

      return {
        events,
        serverTime: Date.now(),
        hasMore,
        nextCheckpoint,
      };
    } finally {
      client.release();
    }
  }

  async exportBackup() {
    const client = await this.pool.connect();
    try {
      const [eventsResult, projectionResult, syncResult] = await Promise.all([
        client.query(
          `
            SELECT
              id,
              aggregate_id,
              aggregate_type,
              event_timestamp_ms,
              device_id,
              event_type,
              event_version,
              payload,
              reason,
              user_id,
              synced_at_ms
            FROM audit_events
            ORDER BY synced_at_ms ASC, id ASC
          `
        ),
        client.query(
          `
            SELECT aggregate_id, aggregate_type, winner_event_id, winner_timestamp_ms, winner_device_id, snapshot, updated_at
            FROM aggregate_projection_state
          `
        ),
        client.query(
          `
            SELECT device_id, last_sync_checkpoint_ms, last_event_id, last_push_at, last_pull_at
            FROM device_sync_metadata
          `
        ),
      ]);

      const exportedAt = Date.now();
      const payload = {
        exportedAt,
        version: "1.0",
        data: {
          events: eventsResult.rows,
          projections: projectionResult.rows,
          syncMetadata: syncResult.rows,
        },
        metadata: {
          totalEvents: eventsResult.rowCount,
          totalProjections: projectionResult.rowCount,
          totalDevices: syncResult.rowCount,
        },
      };

      await client.query(
        `INSERT INTO backup_exports (id, payload) VALUES ($1, $2::jsonb)`,
        [randomUUID(), JSON.stringify(payload)]
      );

      return payload;
    } finally {
      client.release();
    }
  }

  async checkReady() {
    await this.pool.query("SELECT 1");
  }
}

export { EventStore };
