import assert from "node:assert/strict";

function createStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.get(key) ?? null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

async function run() {
  const storage = createStorage();
  globalThis.localStorage = storage;
  globalThis.window = { localStorage: storage };

  const { upsertTaxProfile, getTaxProfile } = await import("../src/taxProfileStore.ts");
  const { listDeductionBrackets, matchDeductionBracket } = await import(
    "../src/deductionBracketStore.ts"
  );
  const { calculateEstimatedDeduction } = await import("../src/deductionEstimation.ts");
  const { monthLifecycleStore } = await import("../src/monthLifecycle.js");
  const {
    saveDeductionReconciliation,
    getDeductionReconciliation,
  } = await import("../src/reconciliationStore.ts");

  const profile = upsertTaxProfile({ companyId: "cmp-auto", annualRevenueForecast: 200000 });
  assert.equal(profile.companyId, "cmp-auto");
  assert.equal(profile.annualRevenueForecast, 200000);

  const loadedProfile = getTaxProfile("cmp-auto");
  assert.equal(loadedProfile?.annualRevenueForecast, 200000);

  const brackets = listDeductionBrackets();
  assert.equal(brackets.length >= 4, true, "default deduction brackets should be available");

  const matched = matchDeductionBracket(loadedProfile?.annualRevenueForecast ?? 0);
  assert.equal(matched?.id, "ded-bracket-02", "200k forecast should map to second bracket");

  const estimation = calculateEstimatedDeduction({
    revenueAmount: 1000,
    annualRevenueForecast: loadedProfile?.annualRevenueForecast ?? 0,
    brackets,
    calculatedAt: "2026-05-25T00:00:00.000Z",
  });

  assert.equal(estimation?.estimatedAmount, 80);
  assert.equal(estimation?.snapshot.matchedBracketId, "ded-bracket-02");
  assert.equal(estimation?.snapshot.matchedRate, 8);

  monthLifecycleStore.sendToReview({ companyId: "cmp-auto", month: "2026-06", actorRole: "owner" });
  monthLifecycleStore.approveAndClose({ companyId: "cmp-auto", month: "2026-06", approverRole: "owner" });
  assert.equal(
    monthLifecycleStore.isMonthClosed({ companyId: "cmp-auto", month: "2026-06" }),
    true,
    "closed month guard should be active for automation flows"
  );

  const reconciliation = saveDeductionReconciliation({
    companyId: "cmp-auto",
    month: "2026-05",
    estimatedTotalDeductions: 80,
    actualTotalDeductions: 75,
    adjustmentValue: -5,
    status: "reconciled",
    reviewedBy: "owner",
    notes: "Teste",
  });

  assert.equal(reconciliation.status, "reconciled");
  const persisted = getDeductionReconciliation("cmp-auto", "2026-05");
  assert.equal(persisted?.adjustmentValue, -5);

  console.log("Automatic deduction support flows validation passed.");
}

run();
