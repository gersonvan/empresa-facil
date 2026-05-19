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

    this.launchEntries.push(entry);
    return entry;
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

    const key = `${monthState.companyId}:${monthState.month}`;
    this.monthStates.set(key, monthState);
    return monthState;
  }

  getMonthStatus(companyId, month) {
    const key = `${companyId}:${normalizeMonth(month)}`;
    return this.monthStates.get(key) ?? null;
  }

  transitionMonthStatus({ companyId, month, nextStatus, updatedAt }) {
    if (!MONTH_STATUS_VALUES.includes(nextStatus)) {
      throw new Error(`Unknown month status '${nextStatus}'.`);
    }

    const current = this.getMonthStatus(companyId, month);
    if (current === null) {
      return this.setMonthStatus({
        companyId,
        month,
        status: nextStatus,
        updatedAt,
      });
    }

    const allowedTransitions = {
      open: ["in_review", "closed"],
      in_review: ["open", "closed"],
      closed: ["closed"],
    };

    if (!allowedTransitions[current.status].includes(nextStatus)) {
      throw new Error(
        `Invalid month status transition from '${current.status}' to '${nextStatus}'.`
      );
    }

    return this.setMonthStatus({
      companyId,
      month,
      status: nextStatus,
      updatedAt,
    });
  }
}

export { CoreRepository };