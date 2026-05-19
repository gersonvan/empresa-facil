export interface MonthLifecycleStatus {
  companyId: string;
  month: string;
  status: "open" | "in_review" | "closed";
  updatedAt: string;
  history: Array<{
    from: "open" | "in_review" | "closed" | null;
    to: "open" | "in_review" | "closed";
    at: string;
    actorRole: string;
    reason: string | null;
  }>;
  hasBeenClosed: boolean;
  closedAt: string | null;
  closedByRole: string | null;
}

export interface MonthLifecycleStore {
  getStatus(input: { companyId: string; month: string }): MonthLifecycleStatus;
  sendToReview(input: {
    companyId: string;
    month: string;
    actorRole?: string;
  }): MonthLifecycleStatus;
  moveBackToOpen(input: {
    companyId: string;
    month: string;
    actorRole?: string;
  }): MonthLifecycleStatus;
  reopenClosedMonth(input: {
    companyId: string;
    month: string;
    actorRole?: string;
  }): MonthLifecycleStatus;
  approveAndClose(input: {
    companyId: string;
    month: string;
    approverRole?: string;
  }): MonthLifecycleStatus;
  isMonthClosed(input: { companyId: string; month: string }): boolean;
}

export function createMonthLifecycleStore(customStorage?: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}): MonthLifecycleStore;

export const monthLifecycleStore: MonthLifecycleStore;