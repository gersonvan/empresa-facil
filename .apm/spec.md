---
title: EmpresaFacil
modified: Spec creation by the Planner.
---

# APM Spec

## Overview

EmpresaFacil is a web system for small-business cost control with a strong focus on simplicity of use. The MVP starts with DRE-oriented visibility, but it must also support personal costs and company costs so the owner can understand the full financial picture without switching tools. The product is expected to accept manual launches and spreadsheet imports, present monthly support for tax and DRE analysis, and keep the experience lightweight enough for daily use on mobile and desktop. Success means a new user can record costs quickly, inspect the monthly result with minimal navigation, and trust the calculation layer enough to use it as operational support while still validating with an accountant.

## Workspace

The workspace is a single planning target rooted at `EmpresaFacil/`; no Git repository was detected at the root during discovery. The main authoritative local business document is [D. R. E. - GERENCIAL.docx](D.%20R.%20E.%20-%20GERENCIAL.docx), which provides the baseline DRE structure and category intent for the first version of the financial view. The workspace also contains the APM scaffolding under [.apm](.apm) and the APM guides, prompts, and skills under [.github](.github). No existing [AGENTS.md](AGENTS.md) was found, so execution rules will be created from scratch during the Rules step.

---

> **Notes:**
> - No repository history or branch structure was available in the workspace root, so planning assumes a fresh build rather than modification of an existing codebase.
> - The DRE source document is authoritative for the starting reporting shape, but the product direction allows simplification so the first release is easier to use than a traditional accounting report.
> - The user explicitly prioritized simplicity over feature breadth, daily use, multi-company support, and a future mobile app rather than a mobile-first native launch.
> - External Simples Nacional references were researched for 2026-oriented calculation context; tax rules should be treated as versioned support data, not hard-coded assumptions.

## Product Direction

The core product decision is to optimize for fast, low-friction financial recording instead of comprehensive accounting depth. The first release must preserve the distinction between company costs and personal costs, but it should not force the user into a complex bookkeeping workflow. The primary reporting lens is the monthly DRE, with the expectation that other views and controls exist only insofar as they reduce friction or improve confidence in the result. A future mobile app is explicitly part of the direction, but the MVP is a responsive web application.

## Cost Model and Scope

The system must record both company costs and personal costs. Company costs feed operational reporting and the DRE; personal costs are tracked in the same product so the owner can keep a broader cash-outflow picture without mixing the two contexts. The model should support multi-company usage from the start so the same user can separate activities by business entity. Because the MVP is meant to be simple, the capture model should stay minimal and avoid requiring accounting expertise from the user.

## DRE and Result Presentation

The DRE baseline comes from [D. R. E. - GERENCIAL.docx](D.%20R.%20E.%20-%20GERENCIAL.docx), but the product is allowed to simplify the presentation if that reduces friction. The report must still preserve the essential structure of revenue, deductions, expenses, financial income, and the final operating result. The user needs to understand profit or loss quickly and see the main cost groups without navigating through a dense accounting layout. The DRE should be designed so the same data that powers the monthly close can also power a compact dashboard view.

## Data Entry and Ingestion

The MVP must accept manual entry and spreadsheet import. Manual entry is the primary fast path for daily use; spreadsheet import is the secondary path for users who already keep records elsewhere and need a faster migration or batch update. The import flow should be treated as a convenience path, not a replacement for simple direct entry. The product should be able to handle inconsistent real-world data gracefully enough for day-to-day use, while still surfacing clear validation issues when rows are malformed or incomplete.

## Monthly Status and Review

Each month must have an explicit status lifecycle: open, in review, and closed. The Dono is the final approver for the monthly DRE, and the system should make that approval visible rather than implicit. The status transition is part of the product model because it protects the monthly close from accidental edits while still letting the finance user work in progress. The monthly review flow must stay short and understandable, because the user wants operational support rather than a heavy approval process.

## Calculation Support and Simples Nacional

The system must provide operational tax support for the Simples Nacional context, starting from 2026-oriented rules gathered during discovery. The calculation layer should be versioned by rule set so that fiscal tables, rate changes, and future adjustments can be updated without rewriting the application logic. The product should show these calculations as support material and always keep a validation reminder that the result must be checked with an accountant. The main goal of the calculation layer is to help the owner anticipate outcomes and monthly burden, not to claim legal authority or replace accounting review.

## Auditability and Confidence

Because calculation error is the main risk, the system must preserve enough history to explain what changed and why the monthly result moved. Launch edits, month status transitions, and tax-rule versions should remain traceable so users can trust the result after corrections or imports. The product should favor explicitness over hidden automation in any area that materially affects the DRE or tax support. This is a confidence feature as much as a finance feature: the owner should be able to see what happened without needing an accountant to interpret every screen.

## Interface Constraints

The interface must be optimized around a few hard simplicity constraints: no more than three steps for any critical action, minimal required fields on launch forms, a guided next-step daily flow, and a dashboard limited to three main indicators. These constraints are not cosmetic; they are core product requirements intended to prevent abandonment. The responsive layout must work on both cell phones and desktops, and the future mobile direction should not depend on a desktop-only design. Authentication is intentionally out of scope for the initial release, so the current product direction should not introduce flows that assume user-account complexity at launch.

## Delivery Boundaries

The MVP includes manual launches, spreadsheet import, monthly DRE support, company/personal cost separation, multi-company support, and tax-support calculations with accountant validation warnings. The first release does not depend on banking integrations, native mobile delivery, or authenticated access. The product can evolve toward those areas later, but they should remain clearly outside the first delivery boundary so the initial system stays small enough to use every day.


