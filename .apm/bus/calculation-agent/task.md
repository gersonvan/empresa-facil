---
stage: 2
task: 3
agent: calculation-agent
log_path: ".apm/memory/stage-02/task-02-03.log.md"
has_dependencies: true
---

# APM Task 2.3: Monthly DRE summary and main indicators

## Task Reference
- Task ID: 2.3
- Assigned agent: calculation-agent

## Context from Dependencies
Building on your previous work:

**From Task 1.3:**
- Deterministic DRE/tax calculation contract exists, including fiscal-rule versioning and accountant-validation warning semantics.

**Integration Approach:**
- Reuse the existing calculation contract outputs rather than duplicating business logic in presentation transformations.

## Objective
Render monthly DRE summary data and compact main indicators from the existing calculation layer.

## Detailed Instructions
1. Transform calculation outputs into monthly summary payloads with revenue, deductions, expenses, financial income, and operating result.
2. Build compact indicator outputs suitable for dashboard use.
3. Produce cost-group summaries aligned with the simplified DRE structure.
4. Ensure output shape can support both a compact dashboard and deeper DRE view without recalculation.
5. Keep the summary focused on operational readability rather than accounting-heavy presentation.

## Workspace
- Code workspace: `.apm/worktrees/feat-monthly-dre-summary-indicators`
- Branch: `feat/monthly-dre-summary-indicators`
- Project root for APM runtime files: `<project-root>`
- Use project root paths for all `.apm` artifacts (Task Log, bus files).

## Expected Output
- Monthly DRE summary output data
- Compact indicator set
- Cost-group summary payloads reusable by dashboard/report views

## Validation Criteria
- Summary contains revenue, deductions, expenses, financial income, and operating result.
- Indicators are visible and consumable without deep navigation assumptions.
- Output remains consistent with Stage 1 calculation contract.
- Same summary payload can drive both dashboard and report views.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If unresolved, report Partial with blockers and attempted fixes.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-02/task-02-03.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/calculation-agent/report.md` and direct the user to return with:

```bash
/apm-5-check-reports calculation-agent
```

General option:

```bash
/apm-5-check-reports
```
