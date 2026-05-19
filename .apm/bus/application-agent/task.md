---
stage: 2
task: 2
agent: application-agent
log_path: ".apm/memory/stage-02/task-02-02.log.md"
has_dependencies: true
---

# APM Task 2.2: Manual entry and spreadsheet import pipeline

## Task Reference
- Task ID: 2.2
- Assigned agent: application-agent

## Context from Dependencies
Building on your previous work:

**From Task 1.2:**
- Core entities and repository patterns already support company/month/cost-type separation.
- Data contract and normalized model are already established.

**Integration Approach:**
- Keep manual entry as primary path.
- Ensure import rows normalize into the same internal launch model used by manual entry.

## Objective
Implement cost ingestion via manual entry and spreadsheet import, with validation and proper routing by company/month/cost type.

## Detailed Instructions
1. Implement create/update manual entry flow using the existing shared model.
2. Build CSV/Excel import parsing, mapping, and row-level validation feedback.
3. Normalize imported rows to the same internal shape used by manual entries.
4. Persist results with strict separation by company, month, personal/company classification, and cost type.
5. Ensure malformed rows are rejected with actionable line-level feedback.

## Workspace
- Code workspace: `.apm/worktrees/feat-manual-entry-import-pipeline`
- Branch: `feat/manual-entry-import-pipeline`
- Project root for APM runtime files: `<project-root>`
- Use project root paths for all `.apm` artifacts (Task Log, bus files).

## Expected Output
- Manual entry create/update flow
- Spreadsheet import pipeline (CSV/Excel)
- Validation feedback mechanism
- Normalized persistence of imported records

## Validation Criteria
- Valid manual launch can be created.
- Multi-row file import works.
- Malformed rows are rejected with useful row-level messages.
- Import path preserves company and cost-type separation.
- Import path does not break manual entry behavior.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If unresolved, report Partial with blockers and attempted fixes.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-02/task-02-02.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/application-agent/report.md` and direct the user to return with:

```bash
/apm-5-check-reports application-agent
```

General option:

```bash
/apm-5-check-reports
```
