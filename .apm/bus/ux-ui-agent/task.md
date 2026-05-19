---
stage: 1
task: 1
agent: ux-ui-agent
log_path: ".apm/memory/stage-01/task-01-01.log.md"
has_dependencies: false
---

# APM Task 1.1: Responsive shell and navigation

## Task Reference
- Task ID: 1.1
- Assigned agent: ux-ui-agent

## Objective
Build the responsive application shell, navigation, and global layout patterns that support simple daily use on mobile and desktop.

## Detailed Instructions
1. Create the initial frontend structure for the MVP screens with a responsive shell that works on phone and desktop widths.
2. Implement top-level navigation for dashboard, launch, DRE, and month review areas.
3. Build reusable screen containers so all top-level screens share the same layout behavior.
4. Keep user flows short by design: critical navigation paths must be reachable in three interactions or fewer.
5. Keep the interface intentionally minimal and clear, with compact information density and no auth-dependent flow.
6. Prepare the dashboard frame so it can later host only three main indicators.

## Workspace
- Code workspace: `.apm/worktrees/feat-responsive-shell-navigation`
- Branch: `feat/responsive-shell-navigation`
- Project root for APM runtime files: `<project-root>`
- If you need to read or write `.apm` artifacts (Task Log, bus files), resolve those paths from `<project-root>`, not from the worktree copy.

## Expected Output
- Responsive shell
- Top-level navigation
- Global dashboard frame
- Reusable layout primitives for launch, DRE, and month review screens

## Validation Criteria
- Shell renders correctly on narrow and wide viewport sizes.
- Main areas are reachable in no more than three taps/clicks from the dashboard.
- MVP screens are navigable without authentication dependencies.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with the actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If a fix does not resolve the issue, run focused debugging with subagents and report unresolved blockers as Partial.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-01/task-01-01.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/ux-ui-agent/report.md` and then direct the user to return here with:

```bash
/apm-5-check-reports ux-ui-agent
```

Also include the general command option:

```bash
/apm-5-check-reports
```
