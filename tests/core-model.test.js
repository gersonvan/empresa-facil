import assert from "node:assert/strict";
import {
  CoreRepository,
  DATA_CONTRACT,
  toIngestionRecord,
  toCalculationRecord,
} from "../src/index.js";

function run() {
  const repo = new CoreRepository();

  const alpha = repo.addCompany({ id: "cmp-alpha", name: "Alpha Ltda" });
  const beta = repo.addCompany({ id: "cmp-beta", name: "Beta ME" });

  assert.equal(repo.listCompanies().length, 2, "must store at least two companies");

  repo.saveUserContext({
    id: "local-user",
    companyIds: [alpha.id, beta.id],
  });

  const userContext = repo.getUserContext("local-user");
  assert.deepEqual(userContext?.companyIds, ["cmp-alpha", "cmp-beta"]);

  const entryA = repo.addLaunchEntry({
    id: "ln-001",
    companyId: alpha.id,
    month: "2026-05",
    costType: "company",
    description: "Software subscription",
    amount: 199.9,
  });

  const entryB = repo.addLaunchEntry({
    id: "ln-002",
    companyId: alpha.id,
    month: "2026-05",
    costType: "personal",
    description: "Owner lunch",
    amount: 34.5,
  });

  repo.addLaunchEntry({
    id: "ln-003",
    companyId: beta.id,
    month: "2026-05",
    costType: "company",
    description: "Office material",
    amount: 80,
  });

  const byCompany = repo.listLaunchEntries({ companyId: alpha.id });
  assert.equal(byCompany.length, 2, "query by company should work");

  const byMonth = repo.listLaunchEntries({ month: "2026-05" });
  assert.equal(byMonth.length, 3, "query by month should work");

  const byCostType = repo.listLaunchEntries({ costType: "personal" });
  assert.equal(byCostType.length, 1, "query by cost type should work");
  assert.equal(byCostType[0].id, entryB.id, "personal/company separation must be clear");

  repo.setMonthStatus({ companyId: alpha.id, month: "2026-05", status: "open" });
  repo.transitionMonthStatus({
    companyId: alpha.id,
    month: "2026-05",
    nextStatus: "in_review",
  });
  repo.transitionMonthStatus({
    companyId: alpha.id,
    month: "2026-05",
    nextStatus: "closed",
  });

  const monthState = repo.getMonthStatus(alpha.id, "2026-05");
  assert.equal(monthState?.status, "closed", "month state should persist without login dependency");

  assert.equal(DATA_CONTRACT.version, "1.0.0");

  const ingestionRecord = toIngestionRecord(entryA);
  assert.deepEqual(ingestionRecord, {
    record_type: "launch_entry",
    company_id: "cmp-alpha",
    month: "2026-05",
    cost_type: "company",
    amount: 199.9,
    description: "Software subscription",
    source_id: "ln-001",
  });

  const calcRecord = toCalculationRecord(entryA);
  assert.deepEqual(calcRecord, {
    entryId: "ln-001",
    companyId: "cmp-alpha",
    month: "2026-05",
    classification: "company",
    amount: 199.9,
  });

  console.log("Task 1.2 validation passed.");
}

run();