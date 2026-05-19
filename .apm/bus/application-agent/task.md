---
stage: 3
task: 1
agent: application-agent
log_path: ".apm/memory/stage-03/task-03-01.log.md"
has_dependencies: true
---

# APM Task 3.1: Month review, status, and approval controls

## Task Reference
- Task ID: 3.1
- Assigned agent: application-agent

## Context from Dependencies
This task depends on completed work from multiple agents.

**Integration Steps:**
1. Read `src/screens/Launch.tsx` and related launch styles to align month-review flow with the current UX daily pattern.
2. Read `src/ingestion.js`, `src/repository.js`, and `src/domain.js` to integrate state transitions and edit protection on top of existing persistence/model rules.
3. Read `src/screens/MonthReview.tsx` and `src/screens/financialOverview.ts` to wire application-level lifecycle behavior into the current month-review screen data flow.
4. Read `src/calculations.js` summary functions used in Stage 2 outputs to ensure month close state works with current monthly overview payloads.

**Producer Output Summary:**
- Stage 2 established guided launch flow and integrated screen surface for month review.
- Ingestion/repository layers already persist normalized launch data and support company/month/cost-type filtering.
- Monthly overview and DRE summary payloads are now consumed by dashboard/report screens.

## Objective
Add open/in review/closed lifecycle and Dono approval controls for monthly DRE, with protected closed periods and visible review state.

## Detailed Instructions
1. Implement month state transitions (`open` -> `in_review` -> `closed`) and explicit approval action for close.
2. Persist lifecycle state per company/month and expose clear state indicators in the flow.
3. Prevent accidental edits in closed months while preserving traceability and visibility.
4. Ensure the flow stays short, understandable, and aligned with current multi-company architecture.
5. If reopen behavior is supported, preserve evidence that close previously occurred.

## Workspace
- Working directory: `<project-root>`
- Branch: `feat/month-review-status-controls`

## Expected Output
- Month status transition controls
- Approval controls for monthly close
- Edit protection for closed periods with traceability
- Visible month review state integrated with existing workflow

## Validation Criteria
- Month transitions through `open`, `in_review`, and `closed`.
- Dono approval closes the month.
- Closed months are protected from accidental changes.
- State remains visible and persisted across reloads.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If unresolved, report Partial with blockers and attempted fixes.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-03/task-03-01.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/application-agent/report.md` and direct the user to return with:

```bash
/apm-5-check-reports application-agent
```

General option:

```bash
/apm-5-check-reports
```
