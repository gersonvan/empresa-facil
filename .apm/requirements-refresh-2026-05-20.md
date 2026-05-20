---
title: Requirements Refresh Snapshot
created_at: 2026-05-20
owner: manager
---

# Requirements Refresh Snapshot

## Summary

The project scope was reopened with a new backend/sync architecture requirement.
The current codebase is functionally strong on frontend flows, but it is still frontend-first.
The main delta is Task 1.6 and all downstream dependencies that require server-backed sync and event sourcing.

## Coverage Against Revised Scope

### Covered or largely covered in current code

- Responsive shell and main screens (dashboard, launch, DRE, month-review, training).
- Design token/theming and base reusable components.
- Basic domain model and lifecycle controls (open, in_review, closed).
- Deterministic DRE/tax support outputs with versioned rules in calculation layer.
- Manual launch flow and simple records visibility.

### Partial coverage

- Multi-company exists at contract/model level but UI and storage are still mostly single-company centered.
- Import path exists, but not yet validated against server sync projections.
- Auditability exists in frontend lifecycle and calculation metadata, but not yet as durable server event log.

### Missing vs revised requirements

- Node.js backend (Fastify) not implemented.
- PostgreSQL persistence and migrations not implemented.
- Event store (append-only) not implemented.
- Sync API (`/api/sync/push`, `/api/sync/pull`) not implemented.
- Deterministic conflict resolution and pending-op queue semantics not implemented end-to-end.
- Backup/export API for server-side recovery not implemented.

## Execution Impact

- Revised scope cannot be considered complete with frontend-only local storage.
- Critical path now depends on delivering Task 1.6 before treating Stage 2/3 outcomes as production-ready against the new plan.

## Recommended Immediate Next Dispatches

1. Task 1.6 (Application Agent): implement backend bootstrap + event store + sync endpoints + migrations.
2. Validation pass: connect current frontend launch/records flows to sync contract adapter.
3. Re-check Stage 2/3 acceptance against server-backed persistence and audit criteria.
