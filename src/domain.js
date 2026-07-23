const MONTH_STATUS_VALUES = ["open", "in_review", "closed"];
const COST_TYPE_VALUES = ["company", "personal"];
const ACCOUNT_ORIGIN_VALUES = ["company", "personal", "unknown"];

function assertRequiredString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

function assertOneOf(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(", ")}.`);
  }
}

function normalizeMonth(month) {
  assertRequiredString(month, "month");
  const normalized = month.trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    throw new Error("month must follow YYYY-MM format.");
  }

  const monthPart = Number(normalized.slice(5, 7));
  if (monthPart < 1 || monthPart > 12) {
    throw new Error("month must follow YYYY-MM format.");
  }

  return normalized;
}

function createCompany({ id, name, createdAt }) {
  assertRequiredString(id, "company.id");
  assertRequiredString(name, "company.name");

  return {
    id: id.trim(),
    name: name.trim(),
    createdAt: createdAt ?? new Date().toISOString(),
  };
}

function createLaunchEntry({
  id,
  companyId,
  month,
  costType,
  accountOrigin,
  description,
  amount,
  createdAt,
}) {
  assertRequiredString(id, "launch.id");
  assertRequiredString(companyId, "launch.companyId");
  assertRequiredString(description, "launch.description");
  assertOneOf(costType, COST_TYPE_VALUES, "launch.costType");
  if (accountOrigin !== undefined) {
    assertOneOf(accountOrigin, ACCOUNT_ORIGIN_VALUES, "launch.accountOrigin");
  }

  if (typeof amount !== "number" || Number.isNaN(amount)) {
    throw new Error("launch.amount must be a valid number.");
  }

  return {
    id: id.trim(),
    companyId: companyId.trim(),
    month: normalizeMonth(month),
    costType,
    accountOrigin: accountOrigin ?? "unknown",
    description: description.trim(),
    amount,
    createdAt: createdAt ?? new Date().toISOString(),
  };
}

function createMonthState({ companyId, month, status, updatedAt }) {
  assertRequiredString(companyId, "monthState.companyId");
  assertOneOf(status, MONTH_STATUS_VALUES, "monthState.status");

  return {
    companyId: companyId.trim(),
    month: normalizeMonth(month),
    status,
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
}

function createUserContext({ id, companyIds }) {
  assertRequiredString(id, "userContext.id");
  if (!Array.isArray(companyIds) || companyIds.length === 0) {
    throw new Error("userContext.companyIds must be a non-empty array.");
  }

  const normalizedCompanyIds = companyIds.map((companyId) => {
    assertRequiredString(companyId, "userContext.companyIds[]");
    return companyId.trim();
  });

  return {
    id: id.trim(),
    companyIds: Array.from(new Set(normalizedCompanyIds)),
  };
}

export {
  MONTH_STATUS_VALUES,
  COST_TYPE_VALUES,
  ACCOUNT_ORIGIN_VALUES,
  normalizeMonth,
  createCompany,
  createLaunchEntry,
  createMonthState,
  createUserContext,
};
