import { normalizeMonth } from "./domain.js";

const STORAGE_KEY = "empresa-facil:month-lifecycle:v1";

function nowIso() {
  return new Date().toISOString();
}

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.get(key) ?? null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

function resolveStorage() {
  if (typeof globalThis !== "undefined" && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return createMemoryStorage();
}

function normalizeIdentity(companyId, month) {
  if (typeof companyId !== "string" || companyId.trim().length === 0) {
    throw new Error("companyId must be a non-empty string.");
  }

  return {
    companyId: companyId.trim(),
    month: normalizeMonth(month),
  };
}

function monthKey(companyId, month) {
  return `${companyId}:${month}`;
}

function readState(storage) {
  const payload = storage.getItem(STORAGE_KEY);
  if (!payload) {
    return {};
  }

  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(storage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureStatusRecord(existing, companyId, month) {
  if (existing) {
    return {
      ...existing,
      history: Array.isArray(existing.history) ? existing.history : [],
      hasBeenClosed: Boolean(existing.hasBeenClosed),
      closedAt: existing.closedAt ?? null,
      closedByRole: existing.closedByRole ?? null,
    };
  }

  return {
    companyId,
    month,
    status: "open",
    updatedAt: nowIso(),
    history: [],
    hasBeenClosed: false,
    closedAt: null,
    closedByRole: null,
  };
}

function appendTransition(record, nextStatus, actorRole, reason, timestamp) {
  if (record.status === nextStatus) {
    return record;
  }

  return {
    ...record,
    status: nextStatus,
    updatedAt: timestamp,
    history: [
      ...record.history,
      {
        from: record.status,
        to: nextStatus,
        at: timestamp,
        actorRole,
        reason: reason ?? null,
      },
    ],
  };
}

function createMonthLifecycleStore(customStorage) {
  const storage = customStorage ?? resolveStorage();

  function getStatus({ companyId, month }) {
    const normalized = normalizeIdentity(companyId, month);
    const all = readState(storage);
    const key = monthKey(normalized.companyId, normalized.month);
    return ensureStatusRecord(all[key], normalized.companyId, normalized.month);
  }

  function saveStatus(record) {
    const all = readState(storage);
    const key = monthKey(record.companyId, record.month);
    all[key] = record;
    writeState(storage, all);
    return record;
  }

  function sendToReview({ companyId, month, actorRole = "owner" }) {
    const current = getStatus({ companyId, month });
    if (current.status === "closed") {
      throw new Error("Closed month must be reopened before returning to review.");
    }

    return saveStatus(
      appendTransition(current, "in_review", actorRole, "Sent to review", nowIso())
    );
  }

  function reopenClosedMonth({ companyId, month, actorRole = "owner" }) {
    const current = getStatus({ companyId, month });
    if (current.status !== "closed") {
      throw new Error("Only closed months can be reopened.");
    }

    if (actorRole !== "owner") {
      throw new Error("Only owner can reopen a closed month.");
    }

    const reopened = appendTransition(
      current,
      "in_review",
      actorRole,
      "Reopened after previous close",
      nowIso()
    );
    reopened.hasBeenClosed = true;
    return saveStatus(reopened);
  }

  function moveBackToOpen({ companyId, month, actorRole = "owner" }) {
    const current = getStatus({ companyId, month });
    if (current.status !== "in_review") {
      throw new Error("Only in-review months can return to open.");
    }

    return saveStatus(
      appendTransition(current, "open", actorRole, "Returned to open", nowIso())
    );
  }

  function approveAndClose({ companyId, month, approverRole = "owner" }) {
    const current = getStatus({ companyId, month });
    if (current.status !== "in_review") {
      throw new Error("Month must be in review before owner approval close.");
    }

    if (approverRole !== "owner") {
      throw new Error("Only owner approval can close the month.");
    }

    const timestamp = nowIso();
    const closed = appendTransition(
      current,
      "closed",
      approverRole,
      "Owner approval close",
      timestamp
    );
    closed.hasBeenClosed = true;
    closed.closedAt = timestamp;
    closed.closedByRole = approverRole;
    return saveStatus(closed);
  }

  function isMonthClosed({ companyId, month }) {
    const status = getStatus({ companyId, month });
    return status.status === "closed";
  }

  return {
    getStatus,
    sendToReview,
    moveBackToOpen,
    reopenClosedMonth,
    approveAndClose,
    isMonthClosed,
  };
}

const monthLifecycleStore = createMonthLifecycleStore();

export { createMonthLifecycleStore, monthLifecycleStore };