import { MONTH_STATUS_VALUES, COST_TYPE_VALUES } from "./domain.js";

const DRE_GROUP_VALUES = [
  "revenue",
  "deductions",
  "expenses",
  "financial_income",
];

const DATA_CONTRACT = {
  version: "1.1.0",
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
      accountOrigin: "company | personal | unknown (optional)",
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

const CALCULATION_INPUT_CONTRACT = {
  fiscalRule: {
    version: "string",
    regime: "string",
    effectiveRate: "number | null",
    accountantValidationWarning: "string",
    changeReason: "string",
    publishedAt: "ISO-8601 string | null",
    source: "string",
  },
  dreLine: {
    entryId: "string",
    companyId: "string",
    month: "YYYY-MM",
    amount: "number",
    dreGroup: DRE_GROUP_VALUES,
    description: "string",
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
    ...(entry.accountOrigin !== undefined ? { account_origin: entry.accountOrigin } : {}),
  };
}

function toCalculationRecord(entry, options = {}) {
  const record = {
    entryId: entry.id,
    companyId: entry.companyId,
    month: entry.month,
    classification: entry.costType,
    amount: entry.amount,
  };

  if (options.dreGroup !== undefined) {
    if (!DRE_GROUP_VALUES.includes(options.dreGroup)) {
      throw new Error(`Unknown DRE group '${options.dreGroup}'.`);
    }

    record.dreGroup = options.dreGroup;
  }

  if (options.description !== undefined) {
    record.description = options.description;
  }

  return record;
}

export {
  DATA_CONTRACT,
  DRE_GROUP_VALUES,
  CALCULATION_INPUT_CONTRACT,
  toIngestionRecord,
  toCalculationRecord,
};
