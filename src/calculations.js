const DRE_GROUP_VALUES = [
  "revenue",
  "deductions",
  "expenses",
  "financial_income",
];

const DEFAULT_ACCOUNTANT_WARNING =
  "A apuracao de tributos e de suporte operacional e deve ser validada pelo contador responsavel antes de qualquer envio oficial.";

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

function assertFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
}

function assertDreGroup(value, fieldName) {
  if (!DRE_GROUP_VALUES.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${DRE_GROUP_VALUES.join(", ")}.`);
  }
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function createFiscalRuleSet({
  version,
  regime = "simples_nacional",
  effectiveRate,
  accountantValidationWarning = DEFAULT_ACCOUNTANT_WARNING,
}) {
  assertNonEmptyString(version, "fiscalRule.version");
  assertNonEmptyString(regime, "fiscalRule.regime");
  assertNonEmptyString(
    accountantValidationWarning,
    "fiscalRule.accountantValidationWarning"
  );

  if (effectiveRate !== undefined && effectiveRate !== null) {
    assertFiniteNumber(effectiveRate, "fiscalRule.effectiveRate");
    if (effectiveRate < 0) {
      throw new Error("fiscalRule.effectiveRate must be greater than or equal to zero.");
    }
  }

  return {
    version: version.trim(),
    regime: regime.trim(),
    effectiveRate: effectiveRate ?? null,
    accountantValidationWarning: accountantValidationWarning.trim(),
  };
}

function createDreLineInput({
  entryId,
  companyId,
  month,
  amount,
  dreGroup,
  description = "",
}) {
  assertNonEmptyString(entryId, "line.entryId");
  assertNonEmptyString(companyId, "line.companyId");
  assertNonEmptyString(month, "line.month");
  assertFiniteNumber(amount, "line.amount");
  assertDreGroup(dreGroup, "line.dreGroup");

  return {
    entryId: entryId.trim(),
    companyId: companyId.trim(),
    month: month.trim(),
    amount: roundCurrency(amount),
    dreGroup,
    description: typeof description === "string" ? description.trim() : "",
  };
}

function calculateDreAndTaxSupport({ companyId, month, lines, fiscalRule }) {
  assertNonEmptyString(companyId, "companyId");
  assertNonEmptyString(month, "month");
  if (!Array.isArray(lines)) {
    throw new Error("lines must be an array.");
  }

  const normalizedFiscalRule = createFiscalRuleSet(fiscalRule);

  const normalizedLines = lines
    .map((line) => createDreLineInput(line))
    .filter((line) => line.companyId === companyId && line.month === month)
    .sort((a, b) => a.entryId.localeCompare(b.entryId));

  const totals = {
    revenue: 0,
    deductions: 0,
    expenses: 0,
    financialIncome: 0,
  };

  normalizedLines.forEach((line) => {
    if (line.dreGroup === "revenue") {
      totals.revenue = roundCurrency(totals.revenue + line.amount);
      return;
    }

    if (line.dreGroup === "deductions") {
      totals.deductions = roundCurrency(totals.deductions + Math.abs(line.amount));
      return;
    }

    if (line.dreGroup === "expenses") {
      totals.expenses = roundCurrency(totals.expenses + Math.abs(line.amount));
      return;
    }

    totals.financialIncome = roundCurrency(totals.financialIncome + line.amount);
  });

  const operatingResult = roundCurrency(
    totals.revenue - totals.deductions - totals.expenses + totals.financialIncome
  );

  const simplesBase = roundCurrency(Math.max(totals.revenue - totals.deductions, 0));
  const estimatedRate = normalizedFiscalRule.effectiveRate;
  const estimatedTax =
    estimatedRate === null ? null : roundCurrency((simplesBase * estimatedRate) / 100);

  return {
    companyId: companyId.trim(),
    month: month.trim(),
    fiscalRuleVersion: normalizedFiscalRule.version,
    dre: {
      groups: {
        revenue: totals.revenue,
        deductions: totals.deductions,
        expenses: totals.expenses,
        financialIncome: totals.financialIncome,
      },
      operatingResult,
      lines: normalizedLines,
    },
    taxSupport: {
      regime: normalizedFiscalRule.regime,
      calculationBase: simplesBase,
      effectiveRate: estimatedRate,
      estimatedTax,
      accountantValidationWarning: normalizedFiscalRule.accountantValidationWarning,
    },
  };
}

const CALCULATION_CONTRACT = {
  version: "1.0.0",
  dreGroups: DRE_GROUP_VALUES,
  fiscalRule: {
    version: "string",
    regime: "simples_nacional",
    effectiveRate: "number | null",
    accountantValidationWarning: "string",
  },
  output: {
    companyId: "string",
    month: "YYYY-MM",
    fiscalRuleVersion: "string",
    dre: {
      groups: {
        revenue: "number",
        deductions: "number",
        expenses: "number",
        financialIncome: "number",
      },
      operatingResult: "number",
      lines: [
        {
          entryId: "string",
          companyId: "string",
          month: "YYYY-MM",
          amount: "number",
          dreGroup: DRE_GROUP_VALUES,
          description: "string",
        },
      ],
    },
    taxSupport: {
      regime: "string",
      calculationBase: "number",
      effectiveRate: "number | null",
      estimatedTax: "number | null",
      accountantValidationWarning: "string",
    },
  },
};

export {
  CALCULATION_CONTRACT,
  DRE_GROUP_VALUES,
  DEFAULT_ACCOUNTANT_WARNING,
  createFiscalRuleSet,
  createDreLineInput,
  calculateDreAndTaxSupport,
};