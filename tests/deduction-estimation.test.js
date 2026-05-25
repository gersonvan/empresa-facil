import assert from "node:assert/strict";
import {
  calculateEstimatedDeduction,
  selectDeductionBracket,
  DEFAULT_DEDUCTION_FORMULA_VERSION,
} from "../src/deductionEstimation.ts";

function run() {
  const brackets = [
    {
      id: "b-3",
      minAnnualRevenue: 360000.01,
      maxAnnualRevenue: 720000,
      estimatedDeductionRate: 10,
      isActive: true,
    },
    {
      id: "b-1",
      minAnnualRevenue: 0,
      maxAnnualRevenue: 180000,
      estimatedDeductionRate: 6,
      isActive: true,
    },
    {
      id: "b-2",
      minAnnualRevenue: 180000.01,
      maxAnnualRevenue: 360000,
      estimatedDeductionRate: 8,
      isActive: true,
    },
  ];

  const atLowerBoundary = selectDeductionBracket({
    annualRevenueForecast: 180000.01,
    brackets,
  });
  assert.equal(atLowerBoundary?.id, "b-2");

  const atUpperBoundary = selectDeductionBracket({
    annualRevenueForecast: 360000,
    brackets,
  });
  assert.equal(atUpperBoundary?.id, "b-2");

  const noBracket = selectDeductionBracket({
    annualRevenueForecast: 900000,
    brackets,
  });
  assert.equal(noBracket, null);

  const estimation = calculateEstimatedDeduction({
    revenueAmount: 1234.56,
    annualRevenueForecast: 200000,
    brackets,
    calculatedAt: "2026-05-25T00:00:00.000Z",
  });

  assert.equal(estimation?.estimatedAmount, 98.76);
  assert.equal(estimation?.snapshot.matchedBracketId, "b-2");
  assert.equal(estimation?.snapshot.matchedRate, 8);
  assert.equal(estimation?.snapshot.formulaVersion, DEFAULT_DEDUCTION_FORMULA_VERSION);
  assert.equal(estimation?.snapshot.calculatedAt, "2026-05-25T00:00:00.000Z");

  const withCustomFormula = calculateEstimatedDeduction({
    revenueAmount: 1000,
    annualRevenueForecast: 100000,
    brackets,
    formulaVersion: "custom-formula-v2",
    calculatedAt: "2026-05-25T00:00:00.000Z",
  });
  assert.equal(withCustomFormula?.snapshot.formulaVersion, "custom-formula-v2");

  const invalidRevenue = calculateEstimatedDeduction({
    revenueAmount: -100,
    annualRevenueForecast: 100000,
    brackets,
  });
  assert.equal(invalidRevenue, null);

  const deterministicA = calculateEstimatedDeduction({
    revenueAmount: 2500,
    annualRevenueForecast: 100000,
    brackets: [...brackets],
    calculatedAt: "2026-05-25T00:00:00.000Z",
  });
  const deterministicB = calculateEstimatedDeduction({
    revenueAmount: 2500,
    annualRevenueForecast: 100000,
    brackets: [...brackets].reverse(),
    calculatedAt: "2026-05-25T00:00:00.000Z",
  });

  assert.deepEqual(deterministicA, deterministicB, "calculation output must be deterministic");

  console.log("Deduction estimation engine validation passed.");
}

run();
