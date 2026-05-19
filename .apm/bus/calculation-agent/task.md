---
stage: 3
task: 2
agent: calculation-agent
log_path: ".apm/memory/stage-03/task-03-02.log.md"
has_dependencies: true
---

# APM Task 3.2: Versioned Simples Nacional support and audit trail

## Task Reference
- Task ID: 3.2
- Assigned agent: calculation-agent

## Context from Dependencies
This task depends on completed work from multiple agents.

**Integration Steps:**
1. Read `src/ingestion.js`, `src/repository.js`, and `src/domain.js` to align tax-support traceability with normalized launch data and month lifecycle behavior.
2. Read `src/calculations.js` and `src/contracts.js` to build on current versioned calculation outputs and summary contracts.
3. Read `src/monthLifecycle.js` and `src/screens/MonthReview.tsx` to align tax-support metadata with monthly close workflow visibility.
4. Read `src/screens/financialOverview.ts` and `src/index.js` to keep export and composition patterns consistent.

**Producer Output Summary:**
- Task 2.2 provides normalized ingestion/manual-entry model and validation pathways.
- Task 2.3 provides monthly DRE summaries and indicator transformations from calculation outputs.
- Task 3.1 adds lifecycle controls, owner close approval, and closed-period traceability context.

## Objective
Finalize the tax-support layer with versioned Simples Nacional rules and traceable calculation outputs tied to monthly lifecycle state.

## Detailed Instructions
1. Finalize/extend versioned Simples Nacional support structures so rule changes do not mutate historical months.
2. Attach audit metadata to tax-support outputs so each month explains which rule set produced the result and why.
3. Ensure outputs preserve accountant-validation warning semantics and remain support-only (non-authoritative).
4. Align tax-support output with month-close flow so users see coherent monthly results with traceability.
5. Preserve historical support outcomes when rules are revised later.

## Workspace
- Working directory: `<project-root>`
- Branch: `feat/versioned-simples-audit-trail`

## Expected Output
- Versioned Simples Nacional support output model
- Audit metadata attached to monthly calculation outputs
- Traceable month-level support figures with rule-version visibility

## Validation Criteria
- Rule version is identifiable for every support calculation.
- Historical results remain stable across rule updates.
- Output metadata is sufficient to explain derivation of support figures.
- Accountant-validation warning remains present.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If unresolved, report Partial with blockers and attempted fixes.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-03/task-03-02.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/calculation-agent/report.md` and direct the user to return with:

```bash
/apm-5-check-reports calculation-agent
```

General option:

```bash
/apm-5-check-reports
```
