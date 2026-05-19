import { COST_TYPE_VALUES, normalizeMonth } from "./domain.js";

function assertRepository(repository) {
  if (!repository || typeof repository.addLaunchEntry !== "function") {
    throw new Error("A valid repository instance is required.");
  }
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

function toFiniteAmount(rawAmount) {
  if (typeof rawAmount === "number") {
    if (Number.isFinite(rawAmount)) {
      return rawAmount;
    }
    throw new Error("amount must be a finite number.");
  }

  if (typeof rawAmount !== "string" || rawAmount.trim().length === 0) {
    throw new Error("amount must be provided.");
  }

  const normalized = rawAmount.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error("amount must be a valid number.");
  }

  return parsed;
}

function normalizeManualEntryInput(input) {
  assertNonEmptyString(input.companyId, "companyId");
  assertNonEmptyString(input.month, "month");
  assertNonEmptyString(input.description, "description");

  if (!COST_TYPE_VALUES.includes(input.costType)) {
    throw new Error(`costType must be one of: ${COST_TYPE_VALUES.join(", ")}.`);
  }

  return {
    companyId: input.companyId.trim(),
    month: normalizeMonth(input.month),
    costType: input.costType,
    description: input.description.trim(),
    amount: toFiniteAmount(input.amount),
  };
}

function createManualEntry({ repository, input, entryId }) {
  assertRepository(repository);
  assertNonEmptyString(entryId, "entryId");

  const normalized = normalizeManualEntryInput(input);
  return repository.addLaunchEntry({
    id: entryId.trim(),
    ...normalized,
  });
}

function updateManualEntry({ repository, entryId, updates }) {
  assertRepository(repository);
  assertNonEmptyString(entryId, "entryId");

  const normalizedUpdates = {
    ...(updates.month !== undefined ? { month: normalizeMonth(updates.month) } : {}),
    ...(updates.costType !== undefined ? { costType: updates.costType } : {}),
    ...(updates.description !== undefined
      ? { description: updates.description }
      : {}),
    ...(updates.amount !== undefined ? { amount: toFiniteAmount(updates.amount) } : {}),
  };

  if (
    normalizedUpdates.costType !== undefined &&
    !COST_TYPE_VALUES.includes(normalizedUpdates.costType)
  ) {
    throw new Error(`costType must be one of: ${COST_TYPE_VALUES.join(", ")}.`);
  }

  return repository.updateLaunchEntry(entryId.trim(), normalizedUpdates);
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseDelimitedText(text, delimiter = ",") {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("import text must be a non-empty string.");
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("import text must contain a header and at least one data row.");
  }

  const headers = parseDelimitedLine(lines[0], delimiter).map((header) =>
    header.trim().toLowerCase()
  );

  const rows = lines.slice(1).map((line, rowIndex) => {
    const values = parseDelimitedLine(line, delimiter);
    const row = {};
    headers.forEach((header, columnIndex) => {
      row[header] = values[columnIndex] ?? "";
    });

    return {
      rowNumber: rowIndex + 2,
      row,
    };
  });

  return { headers, rows };
}

function normalizeSpreadsheetRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("rows must be a non-empty array.");
  }

  return rows.map((row, index) => ({
    rowNumber: index + 2,
    row: Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key.trim().toLowerCase(),
        typeof value === "string" ? value.trim() : value,
      ])
    ),
  }));
}

function normalizeImportedRow({ rowNumber, row, defaults }) {
  const companyId = (row.company_id ?? defaults.companyId ?? "").toString().trim();
  const month = (row.month ?? defaults.month ?? "").toString().trim();
  const costType = (row.cost_type ?? defaults.costType ?? "").toString().trim();
  const description = (row.description ?? "").toString().trim();
  const amountRaw = row.amount ?? "";

  const errors = [];
  if (companyId.length === 0) {
    errors.push("company_id is required");
  }
  if (month.length === 0) {
    errors.push("month is required");
  }
  if (costType.length === 0) {
    errors.push("cost_type is required");
  }
  if (description.length === 0) {
    errors.push("description is required");
  }

  let normalizedMonth = month;
  if (month.length > 0) {
    try {
      normalizedMonth = normalizeMonth(month);
    } catch (error) {
      errors.push("month must follow YYYY-MM format");
    }
  }

  let normalizedAmount = amountRaw;
  try {
    normalizedAmount = toFiniteAmount(amountRaw);
  } catch (error) {
    errors.push(error.message);
  }

  if (costType.length > 0 && !COST_TYPE_VALUES.includes(costType)) {
    errors.push(`cost_type must be one of: ${COST_TYPE_VALUES.join(", ")}`);
  }

  if (errors.length > 0) {
    return {
      ok: false,
      rowNumber,
      errors,
    };
  }

  const sourceId = (row.source_id ?? `import-${rowNumber}`)
    .toString()
    .trim()
    .replace(/\s+/g, "-");

  return {
    ok: true,
    rowNumber,
    value: {
      id: sourceId,
      companyId,
      month: normalizedMonth,
      costType,
      description,
      amount: normalizedAmount,
    },
  };
}

function importRows({ repository, normalizedRows, defaults = {} }) {
  assertRepository(repository);

  const rejected = [];
  const created = [];

  normalizedRows.forEach((rowItem) => {
    const normalized = normalizeImportedRow({
      rowNumber: rowItem.rowNumber,
      row: rowItem.row,
      defaults,
    });

    if (!normalized.ok) {
      rejected.push(normalized);
      return;
    }

    try {
      const entry = repository.addLaunchEntry(normalized.value);
      created.push(entry);
    } catch (error) {
      rejected.push({
        ok: false,
        rowNumber: rowItem.rowNumber,
        errors: [error.message],
      });
    }
  });

  return {
    createdCount: created.length,
    rejectedCount: rejected.length,
    created,
    rejected,
  };
}

function importFromCsv({ repository, text, defaults = {} }) {
  const parsed = parseDelimitedText(text, ",");
  return importRows({ repository, normalizedRows: parsed.rows, defaults });
}

function importFromExcelRows({ repository, rows, defaults = {} }) {
  const normalizedRows = normalizeSpreadsheetRows(rows);
  return importRows({ repository, normalizedRows, defaults });
}

export {
  createManualEntry,
  updateManualEntry,
  parseDelimitedText,
  importFromCsv,
  importFromExcelRows,
};