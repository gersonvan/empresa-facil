function compareByTimestampAndDevice(left, right) {
  if (left.eventTimestampMs !== right.eventTimestampMs) {
    return left.eventTimestampMs - right.eventTimestampMs;
  }

  const deviceCompare = left.deviceId.localeCompare(right.deviceId);
  if (deviceCompare !== 0) {
    return deviceCompare;
  }

  return left.id.localeCompare(right.id);
}

function pickWinner(currentWinner, candidate) {
  if (!currentWinner) {
    return candidate;
  }

  return compareByTimestampAndDevice(currentWinner, candidate) >= 0
    ? currentWinner
    : candidate;
}

function classifyConflict(currentWinner, candidate) {
  const winner = pickWinner(currentWinner, candidate);
  if (!currentWinner || winner.id === candidate.id) {
    return {
      conflict: false,
      winner,
      reason: null,
    };
  }

  return {
    conflict: true,
    winner,
    reason: "superseded_by_lww",
  };
}

export { compareByTimestampAndDevice, pickWinner, classifyConflict };
