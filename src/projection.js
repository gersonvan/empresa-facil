const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function toMonthKey(input) {
  const value = String(input ?? "").trim();
  if (!MONTH_PATTERN.test(value)) {
    throw new Error(`Invalid month format: ${value}`);
  }

  return value;
}

function parseMonth(monthKey) {
  const [yearRaw, monthRaw] = toMonthKey(monthKey).split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  return new Date(year, month - 1, 1);
}

function formatMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function addMonths(monthKey, offset) {
  const date = parseMonth(monthKey);
  date.setMonth(date.getMonth() + offset);
  return formatMonth(date);
}

function compareMonths(left, right) {
  return parseMonth(left).getTime() - parseMonth(right).getTime();
}

function monthDiff(startMonth, endMonth) {
  const startDate = parseMonth(startMonth);
  const endDate = parseMonth(endMonth);
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  );
}

function roundCurrency(value) {
  return Math.round(Number(value) * 100) / 100;
}

function toHorizon(horizonMonths) {
  const parsed = Number(horizonMonths);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 3;
  }

  return Math.min(parsed, 60);
}

function toPositiveAmount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return roundCurrency(parsed);
}

function toPositiveInteger(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function sanitizeCommitment(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  if (raw.type !== "fixed" && raw.type !== "installment") {
    return null;
  }

  if (!raw.companyId || !raw.startMonth) {
    return null;
  }

  const amount = toPositiveAmount(raw.amount);
  if (amount === null) {
    return null;
  }

  const startMonth = toMonthKey(raw.startMonth);
  const endMonth = raw.endMonth ? toMonthKey(raw.endMonth) : null;

  if (endMonth && compareMonths(endMonth, startMonth) < 0) {
    return null;
  }

  if (raw.type === "fixed") {
    return {
      ...raw,
      amount,
      startMonth,
      endMonth,
      type: "fixed",
    };
  }

  const totalInstallments = toPositiveInteger(raw.totalInstallments);
  const currentInstallment = toPositiveInteger(raw.currentInstallment ?? 1);

  if (
    totalInstallments === null ||
    currentInstallment === null ||
    currentInstallment > totalInstallments + 1
  ) {
    return null;
  }

  return {
    ...raw,
    amount,
    startMonth,
    endMonth,
    type: "installment",
    totalInstallments,
    currentInstallment,
  };
}

function isFixedActiveOnMonth(commitment, month) {
  if (compareMonths(month, commitment.startMonth) < 0) {
    return false;
  }

  if (!commitment.endMonth) {
    return true;
  }

  return compareMonths(month, commitment.endMonth) <= 0;
}

function isInstallmentActiveOnMonth(commitment, month) {
  if (compareMonths(month, commitment.startMonth) < 0) {
    return false;
  }

  const totalInstallments = Number(commitment.totalInstallments ?? 0);
  const currentInstallment = Number(commitment.currentInstallment ?? 1);
  const paidBeforeCurrent = Math.max(currentInstallment - 1, 0);
  const remaining = Math.max(totalInstallments - paidBeforeCurrent, 0);
  const offset = monthDiff(commitment.startMonth, month);

  return offset >= 0 && offset < remaining;
}

function toProjectionRow(month) {
  return {
    month,
    fixed: 0,
    installment: 0,
    total: 0,
  };
}

function matchesFilters(commitment, filters) {
  const { companyId, costType = "all" } = filters;

  if (companyId && commitment.companyId !== companyId) {
    return false;
  }

  if (costType !== "all" && commitment.costType !== costType) {
    return false;
  }

  return true;
}

function summarizeRows(rows) {
  const firstThree = rows.slice(0, 3);
  const firstTwelve = rows.slice(0, 12);

  const nextMonth = rows[0]?.total ?? 0;
  const nextThreeMonths = roundCurrency(
    firstThree.reduce((acc, row) => acc + row.total, 0)
  );
  const nextTwelveMonths = roundCurrency(
    firstTwelve.reduce((acc, row) => acc + row.total, 0)
  );
  const horizonTotal = roundCurrency(rows.reduce((acc, row) => acc + row.total, 0));

  let peakMonth = null;
  for (const row of rows) {
    if (!peakMonth || row.total > peakMonth.total) {
      peakMonth = { month: row.month, total: row.total };
    }
  }

  return {
    nextMonth,
    nextThreeMonths,
    nextTwelveMonths,
    horizonTotal,
    peakMonth,
  };
}

export function createProjectionHorizon({ referenceMonth, horizonMonths = 3 }) {
  const month = toMonthKey(referenceMonth);
  const horizon = toHorizon(horizonMonths);

  return Array.from({ length: horizon }, (_, index) => addMonths(month, index));
}

export function projectCommitments({
  referenceMonth,
  horizonMonths = 3,
  commitments = [],
  companyId,
  costType = "all",
}) {
  const months = createProjectionHorizon({ referenceMonth, horizonMonths });
  const rows = months.map((month) => toProjectionRow(month));
  const validCommitments = Array.isArray(commitments)
    ? commitments.map((item) => sanitizeCommitment(item)).filter(Boolean)
    : [];

  for (const commitment of validCommitments) {
    if (!matchesFilters(commitment, { companyId, costType })) {
      continue;
    }

    for (const row of rows) {
      if (commitment.type === "fixed" && isFixedActiveOnMonth(commitment, row.month)) {
        row.fixed = roundCurrency(row.fixed + Number(commitment.amount || 0));
        row.total = roundCurrency(row.fixed + row.installment);
        continue;
      }

      if (
        commitment.type === "installment" &&
        isInstallmentActiveOnMonth(commitment, row.month)
      ) {
        row.installment = roundCurrency(
          row.installment + Number(commitment.amount || 0)
        );
        row.total = roundCurrency(row.fixed + row.installment);
      }
    }
  }

  return {
    referenceMonth: toMonthKey(referenceMonth),
    horizonMonths: months.length,
    rows,
    summary: summarizeRows(rows),
  };
}
