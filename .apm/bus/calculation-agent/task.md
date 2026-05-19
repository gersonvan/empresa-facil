---
stage: 1
task: 3
agent: calculation-agent
log_path: ".apm/memory/stage-01/task-01-03.log.md"
has_dependencies: true
---

# APM Task 1.3: DRE and tax calculation contract

## Task Reference
- Task ID: 1.3
- Assigned agent: calculation-agent

## Context from Dependencies
This task depends on work completed by another agent.

**Integration Steps:**
1. Read `src/domain.js` to understand canonical entities and validation rules for company, launch entry, month state, and user context.
2. Read `src/repository.js` to understand query capabilities and data access patterns by company, month, and cost type.
3. Read `src/contracts.js` to align your calculation input/output contracts with deterministic ingestion and downstream usage expectations.
4. Read `src/index.js` to preserve public exports and avoid breaking the exposed core-model surface.
5. Read `tests/core-model.test.js` to align with behavioral expectations already validated by Task 1.2.

**Producer Output Summary:**
- Core model defines explicit separation for company vs personal costs.
- Month lifecycle state (`open`, `in_review`, `closed`) is explicit and persisted.
- Repository supports deterministic queries by company, month, and cost type.
- Contracts layer exists for stable ingestion/calculation payload shape.
- Current model is intentionally minimal and auth-independent for the MVP.

## Objective
Define and implement the calculation contract for DRE grouping and Simples Nacional support with explicit fiscal-rule versioning.

## Detailed Instructions
1. Define DRE group mapping and a versioned fiscal-rule input model compatible with the existing data contract.
2. Implement deterministic aggregation logic for revenue, deductions, expenses, financial income, and operating result.
3. Expose a calculation payload that UI and review flows can render directly without recalculating in the presentation layer.
4. Ensure the same input set always produces the same output, including the same fiscal-rule version tag.
5. Include explicit accountant-validation warning content in the tax-support output contract.
6. Keep this as operational support, not legal authority; avoid hard-coded one-off assumptions that prevent rule evolution.

## Workspace
- Working directory: `<project-root>`
- Branch: `feat/dre-tax-calculation-contract`

## Expected Output
- Calculation rules schema
- DRE grouping contract
- Versioned tax-support model consumable by later screens/services

## Validation Criteria
- Stable input set yields repeatable DRE totals.
- Output includes revenue, deductions, expenses, financial income, and final operating result.
- Output includes fiscal-rule version tag.
- Output preserves accountant-validation warning concept.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with the actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If a fix does not resolve the issue, run focused debugging with subagents and report unresolved blockers as Partial.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-01/task-01-03.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/calculation-agent/report.md` and then direct the user to return here with:

```bash
/apm-5-check-reports calculation-agent
```

Also include the general command option:

```bash
/apm-5-check-reports
```
