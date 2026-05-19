const DRE_GROUP_VALUES = [
  "revenue",
  "deductions",
  "expenses",
  "financial_income",
];

const DEFAULT_ACCOUNTANT_WARNING =
  "A apuracao de tributos e de suporte operacional e deve ser validada pelo contador responsavel antes de qualquer envio oficial.";
const DEFAULT_RULE_CHANGE_REASON =
  "Regra aplicada para suporte operacional; validar com contabilidade.";

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

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort((left, right) => left.localeCompare(right));
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function fingerprint(value) {
  const source = stableStringify(value);
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fp-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function normalizeLifecycleSnapshot(monthLifecycle) {
  if (monthLifecycle === undefined || monthLifecycle === null) {
    return null;
  }

  assertNonEmptyString(monthLifecycle.status, "monthLifecycle.status");

  return {
    status: monthLifecycle.status,
    hasBeenClosed: Boolean(monthLifecycle.hasBeenClosed),
    closedAt: monthLifecycle.closedAt ?? null,
    closedByRole: monthLifecycle.closedByRole ?? null,
    historyCount: Array.isArray(monthLifecycle.history)
      ? monthLifecycle.history.length
      : null,
  };
}

function createFiscalRuleSet({
  version,
  regime = "simples_nacional",
  effectiveRate,
  accountantValidationWarning = DEFAULT_ACCOUNTANT_WARNING,
  changeReason = DEFAULT_RULE_CHANGE_REASON,
  publishedAt = null,
  source = "manual",
}) {
  assertNonEmptyString(version, "fiscalRule.version");
  assertNonEmptyString(regime, "fiscalRule.regime");
  assertNonEmptyString(
    accountantValidationWarning,
    "fiscalRule.accountantValidationWarning"
  );
  assertNonEmptyString(changeReason, "fiscalRule.changeReason");
  assertNonEmptyString(source, "fiscalRule.source");

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
    changeReason: changeReason.trim(),
    publishedAt,
    source: source.trim(),
  };
}

function createSimplesRuleCatalog({ rules }) {
  if (!Array.isArray(rules) || rules.length === 0) {
    throw new Error("rules must be a non-empty array.");
  }

  const byVersion = new Map();
  rules.forEach((ruleInput) => {
    const rule = createFiscalRuleSet(ruleInput);
    if (byVersion.has(rule.version)) {
      throw new Error(`Duplicate fiscal rule version '${rule.version}'.`);
    }

    byVersion.set(rule.version, rule);
  });

  return {
    byVersion,
    versions: Array.from(byVersion.keys()).sort((left, right) => left.localeCompare(right)),
  };
}

function getFiscalRuleFromCatalog({ ruleCatalog, ruleVersion }) {
  if (!ruleCatalog || !(ruleCatalog.byVersion instanceof Map)) {
    throw new Error("ruleCatalog must be created with createSimplesRuleCatalog.");
  }

  assertNonEmptyString(ruleVersion, "ruleVersion");
  const rule = ruleCatalog.byVersion.get(ruleVersion);
  if (!rule) {
    throw new Error(`Fiscal rule version '${ruleVersion}' not found in catalog.`);
  }

  return { ...rule };
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

function calculateDreAndTaxSupport({
  companyId,
  month,
  lines,
  fiscalRule,
  monthLifecycle,
}) {
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

  const lifecycleSnapshot = normalizeLifecycleSnapshot(monthLifecycle);
  const derivationFingerprint = fingerprint({
    companyId: companyId.trim(),
    month: month.trim(),
    fiscalRuleVersion: normalizedFiscalRule.version,
    regime: normalizedFiscalRule.regime,
    effectiveRate: normalizedFiscalRule.effectiveRate,
    lines: normalizedLines.map((line) => ({
      entryId: line.entryId,
      dreGroup: line.dreGroup,
      amount: line.amount,
    })),
    totals,
    operatingResult,
    simplesBase,
    estimatedTax,
  });

  const ruleFingerprint = fingerprint({
    version: normalizedFiscalRule.version,
    regime: normalizedFiscalRule.regime,
    effectiveRate: normalizedFiscalRule.effectiveRate,
    changeReason: normalizedFiscalRule.changeReason,
    source: normalizedFiscalRule.source,
    publishedAt: normalizedFiscalRule.publishedAt,
  });

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
      ruleVersion: normalizedFiscalRule.version,
      accountantValidationWarning: normalizedFiscalRule.accountantValidationWarning,
      audit: {
        ruleVersion: normalizedFiscalRule.version,
        ruleFingerprint,
        derivationFingerprint,
        ruleChangeReason: normalizedFiscalRule.changeReason,
        ruleSource: normalizedFiscalRule.source,
        rulePublishedAt: normalizedFiscalRule.publishedAt,
        lifecycleSnapshot,
        supportOnly: true,
      },
    },
  };
}

function calculateVersionedSimplesSupport({
  companyId,
  month,
  lines,
  ruleCatalog,
  ruleVersion,
  monthLifecycle,
}) {
  const fiscalRule = getFiscalRuleFromCatalog({
    ruleCatalog,
    ruleVersion,
  });

  return calculateDreAndTaxSupport({
    companyId,
    month,
    lines,
    fiscalRule,
    monthLifecycle,
  });
}

const CALCULATION_CONTRACT = {
  version: "1.0.0",
  dreGroups: DRE_GROUP_VALUES,
  fiscalRule: {
    version: "string",
    regime: "simples_nacional",
    effectiveRate: "number | null",
    accountantValidationWarning: "string",
    changeReason: "string",
    publishedAt: "ISO-8601 string | null",
    source: "string",
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
      ruleVersion: "string",
      accountantValidationWarning: "string",
      audit: {
        ruleVersion: "string",
        ruleFingerprint: "string",
        derivationFingerprint: "string",
        ruleChangeReason: "string",
        ruleSource: "string",
        rulePublishedAt: "ISO-8601 string | null",
        lifecycleSnapshot: {
          status: "open | in_review | closed",
          hasBeenClosed: "boolean",
          closedAt: "ISO-8601 string | null",
          closedByRole: "string | null",
          historyCount: "number | null",
        },
        supportOnly: true,
      },
    },
  },
};

const VERSIONED_SIMPLES_SUPPORT_CONTRACT = {
  version: "1.0.0",
  catalog: {
    versions: ["string"],
    rules: [CALCULATION_CONTRACT.fiscalRule],
  },
  output: CALCULATION_CONTRACT.output,
};

const MONTHLY_DRE_SUMMARY_CONTRACT = {
  version: "1.0.0",
  summary: {
    companyId: "string",
    month: "YYYY-MM",
    fiscalRuleVersion: "string",
    revenue: "number",
    deductions: "number",
    expenses: "number",
    financialIncome: "number",
    operatingResult: "number",
    accountantValidationWarning: "string",
    taxRuleVersion: "string",
    taxDerivationFingerprint: "string",
  },
  indicators: {
    netMarginPercent: "number | null",
    taxBurdenPercent: "number | null",
    totalCosts: "number",
  },
  costGroups: [
    {
      key: "deductions | expenses",
      label: "string",
      amount: "number",
      shareOfRevenuePercent: "number | null",
    },
  ],
};

function assertCalculationOutput(calculationOutput) {
  if (!calculationOutput || typeof calculationOutput !== "object") {
    throw new Error("calculationOutput must be an object.");
  }

  assertNonEmptyString(calculationOutput.companyId, "calculationOutput.companyId");
  assertNonEmptyString(calculationOutput.month, "calculationOutput.month");
  assertNonEmptyString(
    calculationOutput.fiscalRuleVersion,
    "calculationOutput.fiscalRuleVersion"
  );

  const dreGroups = calculationOutput.dre?.groups;
  if (!dreGroups || typeof dreGroups !== "object") {
    throw new Error("calculationOutput.dre.groups must be defined.");
  }

  assertFiniteNumber(dreGroups.revenue, "calculationOutput.dre.groups.revenue");
  assertFiniteNumber(dreGroups.deductions, "calculationOutput.dre.groups.deductions");
  assertFiniteNumber(dreGroups.expenses, "calculationOutput.dre.groups.expenses");
  assertFiniteNumber(
    dreGroups.financialIncome,
    "calculationOutput.dre.groups.financialIncome"
  );
  assertFiniteNumber(calculationOutput.dre?.operatingResult, "calculationOutput.dre.operatingResult");

  const accountantValidationWarning = calculationOutput.taxSupport?.accountantValidationWarning;
  assertNonEmptyString(
    accountantValidationWarning,
    "calculationOutput.taxSupport.accountantValidationWarning"
  );
}

function buildMonthlyDreSummary(calculationOutput) {
  assertCalculationOutput(calculationOutput);

  return {
    companyId: calculationOutput.companyId,
    month: calculationOutput.month,
    fiscalRuleVersion: calculationOutput.fiscalRuleVersion,
    revenue: calculationOutput.dre.groups.revenue,
    deductions: calculationOutput.dre.groups.deductions,
    expenses: calculationOutput.dre.groups.expenses,
    financialIncome: calculationOutput.dre.groups.financialIncome,
    operatingResult: calculationOutput.dre.operatingResult,
    accountantValidationWarning: calculationOutput.taxSupport.accountantValidationWarning,
    taxRuleVersion: calculationOutput.taxSupport.ruleVersion,
    taxDerivationFingerprint: calculationOutput.taxSupport.audit.derivationFingerprint,
  };
}

function buildCompactIndicators(monthlySummary) {
  assertNonEmptyString(monthlySummary.companyId, "monthlySummary.companyId");
  assertFiniteNumber(monthlySummary.revenue, "monthlySummary.revenue");
  assertFiniteNumber(monthlySummary.operatingResult, "monthlySummary.operatingResult");
  assertFiniteNumber(monthlySummary.deductions, "monthlySummary.deductions");
  assertFiniteNumber(monthlySummary.expenses, "monthlySummary.expenses");

  const revenue = monthlySummary.revenue;
  const totalCosts = roundCurrency(monthlySummary.deductions + monthlySummary.expenses);
  const netMarginPercent =
    revenue === 0 ? null : roundCurrency((monthlySummary.operatingResult / revenue) * 100);
  const taxBurdenPercent =
    revenue === 0 ? null : roundCurrency((monthlySummary.deductions / revenue) * 100);

  return {
    companyId: monthlySummary.companyId,
    month: monthlySummary.month,
    netMarginPercent,
    taxBurdenPercent,
    totalCosts,
    operatingResult: monthlySummary.operatingResult,
  };
}

function buildCostGroupSummary(monthlySummary) {
  assertFiniteNumber(monthlySummary.revenue, "monthlySummary.revenue");

  const revenue = monthlySummary.revenue;
  const groups = [
    {
      key: "deductions",
      label: "Deductions",
      amount: monthlySummary.deductions,
    },
    {
      key: "expenses",
      label: "Expenses",
      amount: monthlySummary.expenses,
    },
  ];

  return groups.map((group) => ({
    ...group,
    shareOfRevenuePercent:
      revenue === 0 ? null : roundCurrency((group.amount / revenue) * 100),
  }));
}

function buildMonthlyDreOverview(calculationOutput) {
  const summary = buildMonthlyDreSummary(calculationOutput);
  const indicators = buildCompactIndicators(summary);
  const costGroups = buildCostGroupSummary(summary);

  return {
    summary,
    indicators,
    costGroups,
    taxSupport: calculationOutput.taxSupport,
    views: {
      dashboard: {
        summary,
        indicators,
        taxSupport: calculationOutput.taxSupport,
      },
      dreReport: {
        summary,
        costGroups,
        taxSupport: calculationOutput.taxSupport,
      },
    },
  };
}

export {
  CALCULATION_CONTRACT,
  VERSIONED_SIMPLES_SUPPORT_CONTRACT,
  MONTHLY_DRE_SUMMARY_CONTRACT,
  DRE_GROUP_VALUES,
  DEFAULT_ACCOUNTANT_WARNING,
  DEFAULT_RULE_CHANGE_REASON,
  createFiscalRuleSet,
  createSimplesRuleCatalog,
  getFiscalRuleFromCatalog,
  createDreLineInput,
  calculateDreAndTaxSupport,
  calculateVersionedSimplesSupport,
  buildMonthlyDreSummary,
  buildCompactIndicators,
  buildCostGroupSummary,
  buildMonthlyDreOverview,
};