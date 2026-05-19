import { MONTH_STATUS_VALUES, COST_TYPE_VALUES } from "./domain.js";

const DATA_CONTRACT = {
  version: "1.0.0",
  entities: {
    company: {
      id: "string",
      name: "string",
      createdAt: "ISO-8601 string",
    },
    launchEntry: {
      id: "string",
      companyId: "string",
      month: "YYYY-MM",
      costType: COST_TYPE_VALUES,
      description: "string",
      amount: "number",
      createdAt: "ISO-8601 string",
    },
    monthState: {
      companyId: "string",
      month: "YYYY-MM",
      status: MONTH_STATUS_VALUES,
      updatedAt: "ISO-8601 string",
    },
    userContext: {
      id: "string",
      companyIds: ["string"],
    },
  },
};

function toIngestionRecord(entry) {
  return {
    record_type: "launch_entry",
    company_id: entry.companyId,
    month: entry.month,
    cost_type: entry.costType,
    amount: entry.amount,
    description: entry.description,
    source_id: entry.id,
  };
}

function toCalculationRecord(entry) {
  return {
    entryId: entry.id,
    companyId: entry.companyId,
    month: entry.month,
    classification: entry.costType,
    amount: entry.amount,
  };
}

export { DATA_CONTRACT, toIngestionRecord, toCalculationRecord };