import assert from "node:assert/strict";
import { createProjectionHorizon, projectCommitments } from "../src/projection.js";

function run() {
  const months = createProjectionHorizon({
    referenceMonth: "2026-05",
    horizonMonths: 6,
  });

  assert.deepEqual(months, [
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
  ]);

  const commitments = [
    {
      id: "f-01",
      companyId: "cmp-01",
      description: "Aluguel",
      amount: 2000,
      type: "fixed",
      costType: "company",
      startMonth: "2026-05",
      endMonth: null,
    },
    {
      id: "f-02",
      companyId: "cmp-01",
      description: "Internet",
      amount: 300,
      type: "fixed",
      costType: "company",
      startMonth: "2026-05",
      endMonth: "2026-07",
    },
    {
      id: "i-01",
      companyId: "cmp-01",
      description: "Notebook",
      amount: 500,
      type: "installment",
      costType: "company",
      startMonth: "2026-05",
      totalInstallments: 6,
      currentInstallment: 4,
    },
    {
      id: "i-02",
      companyId: "cmp-01",
      description: "Curso",
      amount: 250,
      type: "installment",
      costType: "personal",
      startMonth: "2026-05",
      totalInstallments: 3,
      currentInstallment: 1,
    },
  ];

  const projection = projectCommitments({
    referenceMonth: "2026-05",
    horizonMonths: 6,
    commitments,
    companyId: "cmp-01",
    costType: "company",
  });

  assert.equal(projection.rows.length, 6);

  // 2026-05: 2000 (aluguel) + 300 (internet) + 500 (notebook restante)
  assert.equal(projection.rows[0].fixed, 2300);
  assert.equal(projection.rows[0].installment, 500);
  assert.equal(projection.rows[0].total, 2800);

  // 2026-08: internet ja terminou, notebook ainda com 1 parcela restante
  assert.equal(projection.rows[3].fixed, 2000);
  assert.equal(projection.rows[3].installment, 0);
  assert.equal(projection.rows[3].total, 2000);

  // Proximo mes e agregado de 3 meses
  assert.equal(projection.summary.nextMonth, 2800);
  assert.equal(projection.summary.nextThreeMonths, 8400);
  assert.equal(projection.summary.horizonTotal, 14400);
  assert.deepEqual(projection.summary.peakMonth, { month: "2026-05", total: 2800 });

  const deterministic = projectCommitments({
    referenceMonth: "2026-05",
    horizonMonths: 6,
    commitments: [...commitments].reverse(),
    companyId: "cmp-01",
    costType: "company",
  });

  assert.deepEqual(deterministic, projection, "projection output must be deterministic");

  const guardedProjection = projectCommitments({
    referenceMonth: "2026-05",
    horizonMonths: 3,
    commitments: [
      {
        id: "invalid-negative",
        companyId: "cmp-01",
        description: "Invalid",
        amount: -100,
        type: "fixed",
        costType: "company",
        startMonth: "2026-05",
      },
      {
        id: "invalid-installment",
        companyId: "cmp-01",
        description: "Invalid",
        amount: 100,
        type: "installment",
        costType: "company",
        startMonth: "2026-05",
        totalInstallments: 3,
        currentInstallment: 5,
      },
      {
        id: "valid",
        companyId: "cmp-01",
        description: "Valid",
        amount: 200,
        type: "fixed",
        costType: "company",
        startMonth: "2026-05",
      },
    ],
    companyId: "cmp-01",
    costType: "company",
  });

  assert.equal(guardedProjection.rows[0].total, 200);
  assert.equal(guardedProjection.summary.horizonTotal, 600);

  const cappedHorizon = createProjectionHorizon({
    referenceMonth: "2026-05",
    horizonMonths: 999,
  });
  assert.equal(cappedHorizon.length, 60);

  console.log("Cash flow projection engine validation passed.");
}

run();
