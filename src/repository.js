import {
  MONTH_STATUS_VALUES,
  COST_TYPE_VALUES,
  createCompany,
  createLaunchEntry,
  createMonthState,
  createUserContext,
  normalizeMonth,
} from "./domain.js";

class CoreRepository {
  constructor() {
    this.companies = new Map();
    this.userContexts = new Map();
    this.launchEntries = [];
    this.monthStates = new Map();
  }

  #getMonthStateKey(companyId, month) {
    return `${companyId}:${normalizeMonth(month)}`;
  }

  #getWritableMonthState(companyId, month) {
    const state = this.getMonthStatus(companyId, month);
    if (state !== null && state.status === "closed") {
      throw new Error(
        `Month '${state.month}' for company '${companyId}' is closed and protected against edits.`
      );
    }
  }

  addCompany(companyInput) {
    const company = createCompany(companyInput);
    if (this.companies.has(company.id)) {
      throw new Error(`Company '${company.id}' already exists.`);
    }

    this.companies.set(company.id, company);
    return company;
  }

  listCompanies() {
    return Array.from(this.companies.values());
  }

  saveUserContext(contextInput) {
    const userContext = createUserContext(contextInput);
    userContext.companyIds.forEach((companyId) => {
      if (!this.companies.has(companyId)) {
        throw new Error(`Company '${companyId}' does not exist.`);
      }
    });

    this.userContexts.set(userContext.id, userContext);
    return userContext;
  }

  getUserContext(userId) {
    return this.userContexts.get(userId) ?? null;
  }

  addLaunchEntry(entryInput) {
    const entry = createLaunchEntry(entryInput);
    if (!this.companies.has(entry.companyId)) {
      throw new Error(`Company '${entry.companyId}' does not exist.`);
    }

    this.#getWritableMonthState(entry.companyId, entry.month);

    this.launchEntries.push(entry);
    return entry;
  }

  getLaunchEntryById(entryId) {
    return this.launchEntries.find((entry) => entry.id === entryId) ?? null;
  }

  updateLaunchEntry(entryId, updateInput) {
    const index = this.launchEntries.findIndex((entry) => entry.id === entryId);
    if (index === -1) {
      throw new Error(`Launch entry '${entryId}' does not exist.`);
    }

    const current = this.launchEntries[index];
    this.#getWritableMonthState(current.companyId, current.month);

    const nextEntry = createLaunchEntry({
      ...current,
      ...updateInput,
      id: current.id,
      companyId: current.companyId,
    });

    this.#getWritableMonthState(nextEntry.companyId, nextEntry.month);

    this.launchEntries[index] = nextEntry;
    return nextEntry;
  }

  listLaunchEntries(filters = {}) {
    const { companyId, month, costType } = filters;
    if (costType !== undefined && !COST_TYPE_VALUES.includes(costType)) {
      throw new Error(`Unknown cost type '${costType}'.`);
    }

    const normalizedMonth = month === undefined ? undefined : normalizeMonth(month);

    return this.launchEntries.filter((entry) => {
      if (companyId !== undefined && entry.companyId !== companyId) {
        return false;
      }
      if (normalizedMonth !== undefined && entry.month !== normalizedMonth) {
        return false;
      }
      if (costType !== undefined && entry.costType !== costType) {
        return false;
      }
      return true;
    });
  }

  setMonthStatus(monthStateInput) {
    const monthState = createMonthState(monthStateInput);
    if (!this.companies.has(monthState.companyId)) {
      throw new Error(`Company '${monthState.companyId}' does not exist.`);
    }

    const key = this.#getMonthStateKey(monthState.companyId, monthState.month);
    const previousState = this.monthStates.get(key) ?? null;
    const history = Array.isArray(previousState?.history)
      ? [...previousState.history]
      : [];

    if (previousState?.status !== monthState.status) {
      history.push({
        from: previousState?.status ?? null,
        to: monthState.status,
        at: monthState.updatedAt,
        actorRole: monthState.updatedByRole ?? "system",
        reason: monthState.reason ?? null,
      });
    }

    const nextState = {
      ...previousState,
      ...monthState,
      history,
      hasBeenClosed:
        monthState.status === "closed" || Boolean(previousState?.hasBeenClosed),
      closedAt:
        monthState.status === "closed"
          ? monthState.updatedAt
          : previousState?.closedAt ?? null,
      closedByRole:
        monthState.status === "closed"
          ? monthState.updatedByRole ?? null
          : previousState?.closedByRole ?? null,
    };

    this.monthStates.set(key, nextState);
    return nextState;
  }

  getMonthStatus(companyId, month) {
    const key = this.#getMonthStateKey(companyId, month);
    return this.monthStates.get(key) ?? null;
  }

  transitionMonthStatus({
    companyId,
    month,
    nextStatus,
    updatedAt,
    updatedByRole = "system",
    reason,
  }) {
    if (!MONTH_STATUS_VALUES.includes(nextStatus)) {
      throw new Error(`Unknown month status '${nextStatus}'.`);
    }

    const current = this.getMonthStatus(companyId, month);
    if (current === null) {
      if (nextStatus === "closed") {
        throw new Error("Month cannot be closed directly. Move to in_review first.");
      }

      return this.setMonthStatus({
        companyId,
        month,
        status: nextStatus,
        updatedAt,
        updatedByRole,
        reason,
      });
    }

    const allowedTransitions = {
      open: ["in_review"],
      in_review: ["open", "closed"],
      closed: ["in_review"],
    };

    if (!allowedTransitions[current.status].includes(nextStatus)) {
      throw new Error(
        `Invalid month status transition from '${current.status}' to '${nextStatus}'.`
      );
    }

    if (nextStatus === "closed") {
      throw new Error("Closing a month requires owner approval via approveAndCloseMonth.");
    }

    if (current.status === "closed" && updatedByRole !== "owner") {
      throw new Error("Only owner can reopen a closed month.");
    }

    return this.setMonthStatus({
      companyId,
      month,
      status: nextStatus,
      updatedAt,
      updatedByRole,
      reason,
    });
  }

  approveAndCloseMonth({ companyId, month, approvedByRole, updatedAt }) {
    if (approvedByRole !== "owner") {
      throw new Error("Only owner approval can close the month.");
    }

    const current = this.getMonthStatus(companyId, month);
    if (current === null) {
      throw new Error("Month must be in review before closing.");
    }

    if (current.status !== "in_review") {
      throw new Error("Month must be in_review before closing.");
    }

    return this.setMonthStatus({
      companyId,
      month,
      status: "closed",
      updatedAt,
      updatedByRole: approvedByRole,
      reason: "Owner approval",
    });
  }
}

export { CoreRepository };