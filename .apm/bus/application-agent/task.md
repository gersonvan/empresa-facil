---
stage: 1
task: 2
agent: application-agent
log_path: ".apm/memory/stage-01/task-01-02.log.md"
has_dependencies: false
---

# APM Task 1.2: Core data model and multi-company workflow

## Task Reference
- Task ID: 1.2
- Assigned agent: application-agent

## Objective
Establish the core data model for companies, cost records, month state, and separation between personal and company costs.

## Detailed Instructions
1. Define entities for company, launch entry, month status lifecycle (`open`, `in_review`, `closed`), and cost classification (`company`, `personal`).
2. Implement a persistence layer with queries by company, by month, and by cost type.
3. Ensure one user context can operate multiple companies without requiring authentication in this MVP.
4. Keep the model minimal but explicit so downstream import and calculation tasks can consume a stable contract.
5. Expose the data contract for ingestion and calculations, including clear field naming and deterministic record structure.
6. Avoid introducing banking integrations or deferred external dependencies.

## Workspace
- Code workspace: `.apm/worktrees/feat-core-data-model-multi-company`
- Branch: `feat/core-data-model-multi-company`
- Project root for APM runtime files: `<project-root>`
- If you need to read or write `.apm` artifacts (Task Log, bus files), resolve those paths from `<project-root>`, not from the worktree copy.

## Expected Output
- Data model for companies, launches, and month state
- Persistence/storage layer
- Workflow primitives for multi-company selection, monthly records, and cost classification

## Validation Criteria
- The model stores at least two companies.
- Personal and company costs are clearly distinguished.
- Month state persists without login dependency.
- Data writes are queryable by company, month, and cost type.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with the actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If a fix does not resolve the issue, run focused debugging with subagents and report unresolved blockers as Partial.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-01/task-01-02.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/application-agent/report.md` and then direct the user to return here with:

```bash
/apm-5-check-reports application-agent
```

Also include the general command option:

```bash
/apm-5-check-reports
```
