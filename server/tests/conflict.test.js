import test from "node:test";
import assert from "node:assert/strict";
import { compareByTimestampAndDevice, classifyConflict } from "../src/conflict.js";

test("compareByTimestampAndDevice prefers latest timestamp", () => {
  const left = { id: "a", eventTimestampMs: 1000, deviceId: "phone-a" };
  const right = { id: "b", eventTimestampMs: 1001, deviceId: "phone-b" };
  assert.ok(compareByTimestampAndDevice(left, right) < 0);
});

test("compareByTimestampAndDevice tie-breaks by deviceId", () => {
  const left = { id: "a", eventTimestampMs: 1000, deviceId: "device-a" };
  const right = { id: "b", eventTimestampMs: 1000, deviceId: "device-z" };
  assert.ok(compareByTimestampAndDevice(left, right) < 0);
});

test("classifyConflict marks candidate as conflict when superseded", () => {
  const existingWinner = {
    id: "evt-2",
    eventTimestampMs: 2000,
    deviceId: "desktop-b",
  };
  const candidate = {
    id: "evt-1",
    eventTimestampMs: 1000,
    deviceId: "mobile-a",
  };

  const outcome = classifyConflict(existingWinner, candidate);
  assert.equal(outcome.conflict, true);
  assert.equal(outcome.winner.id, "evt-2");
  assert.equal(outcome.reason, "superseded_by_lww");
});
