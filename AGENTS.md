APM_RULES {

## Simplicity First
- Keep user-facing flows short and direct.
- For any critical action, prefer at most three steps.
- Minimize required fields; make nonessential fields optional or deferred.
- Do not add extra screens, decisions, or confirmation loops unless they reduce a concrete risk.

## Data Entry and Imports
- Treat manual entry as the primary path unless a task explicitly targets batch import.
- When building import handling, normalize imported rows into the same internal model used by manual entry.
- Surface row-level validation errors clearly and avoid silently dropping malformed data.
- Preserve company, personal, month, and cost-type separation in every write path.

## Financial Calculations
- Keep DRE and tax-support calculations deterministic and repeatable for the same input set.
- Version fiscal rule sets explicitly so historical results do not change when rules are updated.
- Preserve the accountant-validation warning in any tax-support output or screen.
- Favor transparent intermediate totals and traceable results over hidden magic.

## Auditability and Close Control
- Preserve edit history and status changes for any record that affects DRE or tax support.
- Treat month status transitions as explicit application state, not as implied behavior.
- Protect closed periods from accidental edits while keeping the previous trail visible.

## Responsive Delivery
- Build and test for both phone and desktop viewports whenever a task touches the interface.
- Keep layouts compact and readable rather than dense or accounting-heavy.
- Do not introduce auth, banking integrations, or native mobile assumptions unless the task specifically requires them.

## Version Control
- Use branch names in the form `type/short-description` (for example, `feat/responsive-shell`).
- Use commit messages in the form `type: description`.
- Allowed commit types are `feat`, `fix`, `refactor`, `docs`, `test`, and `chore`.

} //APM_RULES