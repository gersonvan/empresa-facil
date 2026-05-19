import assert from "node:assert/strict";
import {
  CoreRepository,
  createMonthLifecycleStore,
  createManualEntry,
} from "../src/index.js";

function createFakeStorage() {
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

function run() {
  const repository = new CoreRepository();
  repository.addCompany({ id: "company-main", name: "Empresa Principal" });

  const opened = repository.transitionMonthStatus({
    companyId: "company-main",
    month: "2026-05",
    nextStatus: "open",
    updatedByRole: "owner",
  });
  assert.equal(opened.status, "open");

  const inReview = repository.transitionMonthStatus({
    companyId: "company-main",
    month: "2026-05",
    nextStatus: "in_review",
    updatedByRole: "owner",
  });
  assert.equal(inReview.status, "in_review");

  assert.throws(
    () =>
      repository.approveAndCloseMonth({
        companyId: "company-main",
        month: "2026-05",
        approvedByRole: "accountant",
      }),
    /Only owner approval can close the month/,
    "month close must require owner approval"
  );

  const closed = repository.approveAndCloseMonth({
    companyId: "company-main",
    month: "2026-05",
    approvedByRole: "owner",
  });
  assert.equal(closed.status, "closed");
  assert.equal(closed.hasBeenClosed, true);
  assert.equal(typeof closed.closedAt, "string");

  assert.throws(
    () =>
      createManualEntry({
        repository,
        entryId: "manual-closed",
        input: {
          companyId: "company-main",
          month: "2026-05",
          costType: "company",
          description: "Should fail",
          amount: "20,00",
        },
      }),
    /closed and protected against edits/,
    "closed months must block accidental writes"
  );

  const reopened = repository.transitionMonthStatus({
    companyId: "company-main",
    month: "2026-05",
    nextStatus: "in_review",
    updatedByRole: "owner",
    reason: "Need adjustment",
  });
  assert.equal(reopened.status, "in_review");
  assert.equal(reopened.hasBeenClosed, true, "close evidence should be preserved");

  const lifecycle = createMonthLifecycleStore(createFakeStorage());
  const initialState = lifecycle.getStatus({ companyId: "company-main", month: "2026-05" });
  assert.equal(initialState.status, "open");

  lifecycle.sendToReview({ companyId: "company-main", month: "2026-05", actorRole: "owner" });
  lifecycle.approveAndClose({
    companyId: "company-main",
    month: "2026-05",
    approverRole: "owner",
  });

  const persisted = lifecycle.getStatus({ companyId: "company-main", month: "2026-05" });
  assert.equal(persisted.status, "closed");
  assert.equal(persisted.hasBeenClosed, true);

  const reopenedLifecycle = lifecycle.reopenClosedMonth({
    companyId: "company-main",
    month: "2026-05",
    actorRole: "owner",
  });
  assert.equal(reopenedLifecycle.status, "in_review");
  assert.equal(reopenedLifecycle.hasBeenClosed, true);

  console.log("Task 3.1 validation passed.");
}

run();