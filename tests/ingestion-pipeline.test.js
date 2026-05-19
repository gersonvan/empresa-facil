import assert from "node:assert/strict";
import {
  CoreRepository,
  createManualEntry,
  updateManualEntry,
  importFromCsv,
  importFromExcelRows,
} from "../src/index.js";

function run() {
  const repository = new CoreRepository();
  repository.addCompany({ id: "cmp-a", name: "Empresa A" });
  repository.addCompany({ id: "cmp-b", name: "Empresa B" });

  const manualEntry = createManualEntry({
    repository,
    entryId: "manual-001",
    input: {
      companyId: "cmp-a",
      month: "2026-05",
      costType: "company",
      description: "Internet",
      amount: "150,00",
    },
  });

  assert.equal(manualEntry.id, "manual-001", "manual launch should be created");
  assert.equal(manualEntry.amount, 150);

  const updatedEntry = updateManualEntry({
    repository,
    entryId: "manual-001",
    updates: {
      description: "Internet + phone",
      amount: 180.5,
      costType: "company",
      month: "2026-05",
    },
  });

  assert.equal(updatedEntry.description, "Internet + phone");
  assert.equal(updatedEntry.amount, 180.5);

  const csvResult = importFromCsv({
    repository,
    text: [
      "company_id,month,cost_type,description,amount,source_id",
      "cmp-a,2026-05,personal,Meal,34.20,csv-001",
      "cmp-b,2026-05,company,Office Supplies,210,csv-002",
      "cmp-a,2026-13,company,Bad Month,88,csv-bad-month",
      "cmp-a,2026-05,unknown,Bad Type,77,csv-bad-type",
      "cmp-a,2026-05,company,,10,csv-bad-description",
    ].join("\n"),
  });

  assert.equal(csvResult.createdCount, 2, "multi-row csv import should persist valid rows");
  assert.equal(csvResult.rejectedCount, 3, "invalid csv rows should be rejected");

  const monthError = csvResult.rejected.find((item) => item.rowNumber === 4);
  assert.equal(monthError?.ok, false);
  assert.equal(
    monthError?.errors.includes("month must follow YYYY-MM format"),
    true,
    "row-level month error should be explicit"
  );

  const costTypeError = csvResult.rejected.find((item) => item.rowNumber === 5);
  assert.equal(costTypeError?.ok, false);
  assert.equal(
    costTypeError?.errors.some((error) => error.includes("cost_type must be one of")),
    true,
    "row-level cost type error should be explicit"
  );

  const excelResult = importFromExcelRows({
    repository,
    rows: [
      {
        company_id: "cmp-b",
        month: "2026-06",
        cost_type: "company",
        description: "Consulting",
        amount: 300,
        source_id: "xls-001",
      },
      {
        company_id: "cmp-b",
        month: "",
        cost_type: "personal",
        description: "Taxi",
        amount: 35,
        source_id: "xls-002",
      },
    ],
  });

  assert.equal(excelResult.createdCount, 1, "excel-style import should persist valid rows");
  assert.equal(excelResult.rejectedCount, 1, "excel-style invalid rows should be rejected");
  assert.equal(excelResult.rejected[0].rowNumber, 3);

  const companyAEntries = repository.listLaunchEntries({ companyId: "cmp-a" });
  const companyBEntries = repository.listLaunchEntries({ companyId: "cmp-b" });
  assert.equal(companyAEntries.length, 2);
  assert.equal(companyBEntries.length, 2);

  const personalEntries = repository.listLaunchEntries({ costType: "personal" });
  assert.equal(
    personalEntries.every((entry) => entry.costType === "personal"),
    true,
    "personal and company costs must remain separated"
  );

  const manualAfterImport = repository.getLaunchEntryById("manual-001");
  assert.equal(manualAfterImport?.description, "Internet + phone");

  console.log("Task 2.2 validation passed.");
}

run();