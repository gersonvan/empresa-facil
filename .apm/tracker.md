---
title: EmpresaFacil
updated_at: 2026-05-20T12:00:00Z
---

# APM Tracker

## Task Tracking

**Stage 1:** In Progress

**Stage 2:** Not Started

**Stage 3:** Not Started

## Worker Tracking

| Agent | Instance | Notes |
|-------|----------|-------|
| ux-ui-agent | 1 | Initialized |
| application-agent | 1 | Initialized |
| calculation-agent | 1 | Initialized |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
|-----------|-------------|-------------------|-------------------|
| EmpresaFacil | main | `type/short-description` | `type: description` (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`) |

## Working Notes
- User requested APM artifacts to be synchronized in version control.
- Planner updated Plan with design adaptation tasks (1.4, 1.5, 2.4).
- Planner added Task 1.6 for Node.js + PostgreSQL backend sync architecture.
- Tracker reopened to reflect pending execution on revised scope.
- Current implementation baseline is frontend-first (React/Vite with local persistence) and does not yet implement Task 1.6 backend/sync stack.
- New requirement baseline includes Fastify + PostgreSQL, event-sourced audit log, and offline sync protocol from `.apm/data-architecture.md`.

