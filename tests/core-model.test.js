import assert from "node:assert/strict";
import {
  CoreRepository,
  DATA_CONTRACT,
  DRE_GROUP_VALUES,
  CALCULATION_INPUT_CONTRACT,
  toIngestionRecord,
  toCalculationRecord,
  CALCULATION_CONTRACT,
  DEFAULT_ACCOUNTANT_WARNING,
  createFiscalRuleSet,
  createDreLineInput,
  calculateDreAndTaxSupport,
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
  assert.equal(Array.isArray(DRE_GROUP_VALUES), true);
  assert.equal(typeof CALCULATION_INPUT_CONTRACT.fiscalRule.version, "string");
  assert.equal(CALCULATION_CONTRACT.version, "1.0.0");

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

  const fiscalRule = createFiscalRuleSet({
    version: "simples-v2026.05",
    effectiveRate: 6,
  });

  const dreLines = [
    createDreLineInput({
      entryId: "line-03",
      companyId: "cmp-alpha",
      month: "2026-05",
      amount: 50,
      dreGroup: "financial_income",
      description: "Bank yield",
    }),
    createDreLineInput({
      entryId: "line-01",
      companyId: "cmp-alpha",
      month: "2026-05",
      amount: 1000,
      dreGroup: "revenue",
      description: "Service invoice",
    }),
    createDreLineInput({
      entryId: "line-02",
      companyId: "cmp-alpha",
      month: "2026-05",
      amount: 100,
      dreGroup: "deductions",
      description: "Discounts",
    }),
    createDreLineInput({
      entryId: "line-04",
      companyId: "cmp-alpha",
      month: "2026-05",
      amount: 400,
      dreGroup: "expenses",
      description: "Operating costs",
    }),
  ];

  const firstCalc = calculateDreAndTaxSupport({
    companyId: "cmp-alpha",
    month: "2026-05",
    lines: dreLines,
    fiscalRule,
  });

  const secondCalc = calculateDreAndTaxSupport({
    companyId: "cmp-alpha",
    month: "2026-05",
    lines: [...dreLines].reverse(),
    fiscalRule,
  });

  assert.deepEqual(firstCalc, secondCalc, "calculation output must be deterministic");
  assert.equal(firstCalc.dre.groups.revenue, 1000);
  assert.equal(firstCalc.dre.groups.deductions, 100);
  assert.equal(firstCalc.dre.groups.expenses, 400);
  assert.equal(firstCalc.dre.groups.financialIncome, 50);
  assert.equal(firstCalc.dre.operatingResult, 550);
  assert.equal(firstCalc.fiscalRuleVersion, "simples-v2026.05");
  assert.equal(
    firstCalc.taxSupport.accountantValidationWarning,
    DEFAULT_ACCOUNTANT_WARNING
  );
  assert.equal(firstCalc.taxSupport.calculationBase, 900);
  assert.equal(firstCalc.taxSupport.estimatedTax, 54);

  console.log("Task 1.2 validation passed.");
}

run();