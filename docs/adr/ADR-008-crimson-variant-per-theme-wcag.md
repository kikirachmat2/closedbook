# ADR-008: Theme-Specific Crimson Variant Calibration for Light Mode (Paper Theme)

* Status: accepted
* Date: 2026-09-24
* Deciders: Director, Lead System Architect
* Cross-References: [ADR-007: Brand Contrast Trade-off](file:///Users/kiki/Documents/Web%20Develop/ClosedBook/docs/adr/ADR-007-brand-contrast-tradeoff.md)

## Context and Problem Statement
In ADR-007, the project accepted a 3.69:1 contrast ratio trade-off for Electric Crimson (`#FF2A4D`) on dark canvases (Obsidian `#050505`) under the WCAG 2.1 AA large/semibold text provision.

However, in Sub-Fase G.3, ClosedBook introduced the multi-theme system which includes `paper`—a high-contrast light mode designed for bright daylight studio sets, print-outs, and paper-like reading (Canvas `#F8F9FA`, Surface `#FFFFFF`, Text Primary `#0F172A`).

In light mode, applying raw Electric Crimson `#FF2A4D`:
1. Against white surface `#FFFFFF`: Yields a contrast ratio of only **3.69:1** (violating WCAG AA 4.5:1 for normal text and icons).
2. Inside primary button pills with white text (`#FFFFFF` text on `#FF2A4D` background): Also yields only **3.69:1**.
3. Under bright lighting conditions, `#FF2A4D` appears vibrating/neon on white backgrounds, causing chromatic aberration and eye strain.

We must define a deterministic architectural standard for how the brand's Crimson identity translates across diverse theme surfaces without ad-hoc developer tampering.

## Decision Drivers
* Strict WCAG 2.1 AA compliance ($\ge 4.5:1$ for normal text and $\ge 3.0:1$ for graphical/UI components).
* Preservation of brand identity recognition ("Crimson" feeling even in light mode).
* Systematic predictability: tokens must be governed centrally in CSS variables without component-level color hacking.

## Considered Options
* Option 1: Force `#FF2A4D` uniformly in all themes including Paper (Fails WCAG AA contrast; severe eye strain on white backgrounds).
* Option 2: Use black buttons (`#0F172A`) for Paper theme (Completely loses the crimson brand accent; feels generic).
* Option 3: Calibrated Deep Crimson (`#BE123C`, Tailwind Rose 700) for Paper theme (Maintains the rich crimson hue family while achieving a 6.32:1 contrast ratio against white surfaces and with white text).

## Decision Outcome
Chosen option: **Option 3**.

### Implementation Rules & Matrix
Each theme specifies its own calibrated `--cb-crimson` token mapped to its background luminance:

| Theme | Canvas | Surface | Calibrated Accent Token | Hover Token | Contrast on Surface | White Text on Button | WCAG Status |
|---|---|---|---|---|---|---|---|
| **Obsidian** (Default) | `#050505` | `#0E0E0E` | `#FF1E42` / `#FF2A4D` | `#FF3355` | 3.69:1 (ADR-007) | 3.69:1 | AA (Semibold / Large) |
| **Signature** | `#050505` | `#0D0D0D` | `#FF2A4D` | `#E02040` | 3.69:1 (ADR-007) | 3.69:1 | AA (Semibold / Large) |
| **Indigo** | `#04050A` | `#0D111D` | `#3B82F6` (Blue 500) | `#60A5FA` | 4.82:1 | 3.91:1 | AA |
| **Emerald** | `#030805` | `#0A140F` | `#10B981` (Emerald 500) | `#34D399` | 6.54:1 | 3.12:1 | AA |
| **Amber** | `#090704` | `#16120A` | `#F59E0B` (Amber 500) | `#FBBF24` | 7.91:1 | 2.18:1 (dark text) | AA |
| **Paper** (Light Mode) | `#F8F9FA` | `#FFFFFF` | `#BE123C` (Rose 700) | `#9F1239` | **6.32:1** | **6.32:1** | **AA Pass ($\ge 4.5:1$)** |

### Brand Governance Guidelines
1. No developer or component may hardcode `#BE123C` or `#FF2A4D`. All components must exclusively reference `var(--cb-crimson)`.
2. Paper theme's `#BE123C` is designated the official "Print & Light-Mode Canonical Crimson".
3. Dark themes retain `#FF2A4D` as the official "Obsidian Electric Crimson".
