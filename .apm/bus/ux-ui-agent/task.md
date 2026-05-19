---
stage: 1
task: 4
agent: ux-ui-agent
log_path: ".apm/memory/stage-01/task-01-04.log.md"
has_dependencies: true
---

# APM Task 1.4: Design Tokens and Theming

## Task Reference
- Task ID: 1.4
- Assigned agent: ux-ui-agent

## Context from Dependencies
Building on your previous work:

**From Task 1.1:**
- A responsive shell and navigation system is already implemented with mobile/desktop adaptations.
- Top-level screens and shared layout containers already exist.
- Global styles are present and currently drive the visual baseline.

**Integration Approach:**
- Build token and theming foundations into the existing global style architecture.
- Avoid breaking shell/navigation behavior while introducing theme variables and toggling support.

## Objective
Implement design tokens (colors, typography, spacing) and a reusable theming system aligned with the provided high-fidelity prototypes.

## Detailed Instructions
1. Extract and define design tokens from the available design artifacts in the workspace and structure them for reuse.
2. Implement a global theming system with light and dark modes, ensuring tokens are the source of truth.
3. Apply tokens consistently across existing shell/navigation and current top-level screens.
4. Ensure accessibility baseline for contrast and readability in both themes.
5. Keep responsive behavior intact on phone and desktop viewports.

## Workspace
- Working directory: `<project-root>`
- Branch: `feat/design-tokens-theming`

## Expected Output
- Reusable design-token system
- Global theming mechanism with light and dark mode support
- Consistent token usage across existing components/screens

## Validation Criteria
- Tokens are applied consistently across the updated UI surface.
- Theme toggling works between light and dark without visual inconsistencies.
- Contrast and readability remain acceptable across both themes.
- Existing responsive shell/navigation behavior remains functional.

## Instruction Accuracy
The objective and expected output are authoritative. If any detailed instruction conflicts with the actual codebase state, validate the real state and adapt accordingly.

## Task Iteration
When validation fails, investigate before fixing. Apply one targeted change per iteration. If a fix does not resolve the issue, run focused debugging with subagents and report unresolved blockers as Partial.

## Task Logging
After completion, write your Task Log to `.apm/memory/stage-01/task-01-04.log.md` following `.github/apm-guides/task-logging.md` section 3.1.

## Reporting Instructions
Write your Task Report to `.apm/bus/ux-ui-agent/report.md` and then direct the user to return here with:

```bash
/apm-5-check-reports ux-ui-agent
```

Also include the general command option:

```bash
/apm-5-check-reports
```
