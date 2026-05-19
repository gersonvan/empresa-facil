---
stage: 2
task: 4
agent: ux-ui-agent
log_path: ".apm/memory/stage-02/task-02-04.log.md"
has_dependencies: true
---

# APM Task 2.4: Screen Implementation

## Task Reference
- Task ID: 2.4
- Assigned agent: ux-ui-agent

## Context from Dependencies
Building on your previous work:

**From Task 1.5:**
- Reusable base UI components (`Button`, `Input`, `Card`) are available and integrated in current screens.
- Token and theming foundations are already active and should remain the visual baseline.

**Integration Approach:**
- Implement dashboard, DRE view, and month-close screens using the existing component library.
- Keep consistency with the prototype-driven style direction and current responsive shell.

## Objective
Implement the main screens (dashboard, DRE view, month-close) based on the design prototypes, integrated with the current application framework.

## Detailed Instructions
1. Implement production-ready dashboard, DRE, and month-close screens using shared UI primitives.
2. Integrate with existing data/calculation services where available (no duplicated business logic).
3. Keep screen structure consistent with token/theming system and responsive behavior across mobile and desktop.
4. Ensure interactions are clear and usable for daily workflow and monthly review context.
5. Preserve simplicity constraints in navigation and interaction flow.

## Workspace
- Working directory: `<project-root>`
- Branch: `feat/screen-implementation-prototypes`

## Expected Output
- Main screens implemented and integrated with current app structure
- Visual consistency with design prototypes and component library usage

## Validation Criteria
- Screens are visually consistent with prototypes.
- Screens are functionally integrated with existing application services.
- Layout and behavior remain responsive and usable on desktop and mobile.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If unresolved, report Partial with blockers and attempted fixes.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-02/task-02-04.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/ux-ui-agent/report.md` and direct the user to return with:

```bash
/apm-5-check-reports ux-ui-agent
```

General option:

```bash
/apm-5-check-reports
```
