---
stage: 2
task: 1
agent: ux-ui-agent
log_path: ".apm/memory/stage-02/task-02-01.log.md"
has_dependencies: true
---

# APM Task 2.1: Fast launch forms and guided daily flow

## Task Reference
- Task ID: 2.1
- Assigned agent: ux-ui-agent

## Context from Dependencies
This task depends on work completed by multiple tasks.

**From your previous UX work (Task 1.1):**
- Responsive shell, navigation, and screen containers are already in place.

**Cross-agent integration required (Task 1.2):**
1. Read `src/domain.js` for entity constraints and classifications (`company`, `personal`, month state concepts).
2. Read `src/repository.js` for query and persistence patterns by company, month, and cost type.
3. Read `src/contracts.js` and `src/index.js` to align launch form payloads with the established data contract and exported APIs.

**Integration Approach:**
- Keep the launch experience minimal while aligning fields and submission shape with the existing normalized data model.

## Objective
Create the minimal launch experience and guided daily flow that lets users record costs in three steps or fewer.

## Detailed Instructions
1. Design and implement manual launch forms with minimal required fields and clearly deferred optional fields.
2. Make personal vs company entry intent explicit without heavy accounting language.
3. Add guided daily next-step cues so users are prompted toward the most relevant action.
4. Ensure the flow remains responsive and usable on phone and desktop.
5. Align form structure with the shared data contract so import and manual paths stay conceptually consistent.

## Workspace
- Code workspace: `.apm/worktrees/feat-launch-forms-guided-flow`
- Branch: `feat/launch-forms-guided-flow`
- Project root for APM runtime files: `<project-root>`
- Use project root paths for all `.apm` artifacts (Task Log, bus files).

## Expected Output
- Manual launch forms
- Daily next-step prompts/guidance
- Minimal required field flow for personal and company entries

## Validation Criteria
- Launch can be completed in three steps or fewer.
- Required fields remain minimal and optional fields are deferred.
- Daily flow clearly indicates next relevant user action.
- Layout remains usable on both phone and desktop.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If unresolved, report Partial with blockers and attempted fixes.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-02/task-02-01.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/ux-ui-agent/report.md` and direct the user to return with:

```bash
/apm-5-check-reports ux-ui-agent
```

General option:

```bash
/apm-5-check-reports
```
