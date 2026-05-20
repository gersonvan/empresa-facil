const PUSH_CONTRACT = {
  request: {
    deviceId: "string",
    since: "number",
    events: [
      {
        id: "string",
        aggregateId: "string",
        aggregateType: "string",
        timestamp: "number",
        eventType: "string",
        eventVersion: "number",
        payload: "object",
        reason: "string | null",
      },
    ],
  },
  response: {
    accepted: ["string"],
    conflicts: [
      {
        eventId: "string",
        aggregateId: "string",
        aggregateType: "string",
        reason: "duplicate_event_id | superseded_by_lww",
        winnerEventId: "string | undefined",
      },
    ],
    serverTime: "number",
  },
};

const PULL_CONTRACT = {
  request: {
    since: "number",
    deviceId: "string",
    limit: "number",
  },
  response: {
    events: [
      {
        id: "string",
        aggregateId: "string",
        aggregateType: "string",
        timestamp: "number",
        deviceId: "string",
        eventType: "string",
        eventVersion: "number",
        payload: "object",
        reason: "string | null",
        userId: "string | null",
        syncedAt: "number",
      },
    ],
    serverTime: "number",
    hasMore: "boolean",
    nextCheckpoint: "number",
  },
};

export { PUSH_CONTRACT, PULL_CONTRACT };
