# ADR-007: Brand Identity versus WCAG Contrast Ratio Trade-off

* Status: accepted
* Date: 2026-09-23
* Deciders: Director, Lead System Architect

## Context and Problem Statement
In Sub-Fase F.4 and G.0, axe-core automated audits flagged a `color-contrast` violation on `.btn-primary-crimson > span` (white text on Electric Crimson `#FF2A4D`, yielding a contrast ratio of 3.69:1).
Standard WCAG 2.1 AA requires 4.5:1 for normal body text, but establishes an exception threshold of 3.0:1 for "Large Scale Text" (defined as $\ge 18\text{pt}$ / $24\text{px}$ regular, or $\ge 14\text{pt}$ / $18.66\text{px}$ bold/semibold).
Darkening the Electric Crimson brand color to satisfy 4.5:1 would compromise the signature visual identity of ClosedBook (Obsidian Canvas + Electric Crimson).

## Decision Drivers
* Preservation of ClosedBook core brand identity (Signature Electric Crimson `#FF2A4D`).
* Compliance with accessibility standards for professional production tools.
* Elimination of critical blockers while transparently documenting design trade-offs.

## Considered Options
* Option 1: Darken Electric Crimson to `#C41230` to achieve 4.5:1 (Dulls brand punchiness, conflicts with established visual system).
* Option 2: Change text color to dark/black `#050505` (Inverts tactile aesthetic and looks visually inconsistent on red buttons).
* Option 3: Retain `#FF2A4D` with semi-bold typography $\ge 14\text{pt}$ (18.66px) / tracking adjustments, qualifying under the WCAG AA 3.0:1 large/semibold text provision, and formally accept the 3.69:1 contrast ratio as an explicit design decision.

## Decision Outcome
Chosen option: **Option 3**.

### Implementation Details
* Primary action buttons utilize semi-bold weight (`font-semibold`) and minimum 14pt visual height.
* The 3.69:1 contrast ratio is formally accepted and logged as an intentional brand design decision.
* Critical a11y violations in axe-core remain strictly zero (0).
