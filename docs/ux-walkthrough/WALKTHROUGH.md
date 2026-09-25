# G.4 Mobile Shell — UX Psychology Walkthrough & Verification Report

**Date**: 2026-09-25  
**Branch**: `feat/g4-mobile-shell`  
**Base**: `develop` (`v0.4.0-design-system`)  
**Scope**: Sub-Fase G.4 Mobile Shell (Navigation + Overlays + UX Psychology)

---

## 1. Walkthrough Recording Artifacts

- **Video Recording**: `docs/ux-walkthrough/closedbook-g5.webm` (Recorded live via high-fidelity browser automation in iPhone 15 mobile viewport 390×844).
  - *Browser Playback Note*: WebM container is natively supported on Chrome, Firefox, Edge, and Android. On iOS Safari, please view via Chrome/Firefox or desktop browser.
- **Key Frames Captured**:
  1. `landing_page_1790272183578.png` — Onboarding & Clean Obsidian Canvas
  2. `workspace_ledger_1790272219838.png` — Top App Bar & 5-Tab Hick's Law Bottom Navigation (Primacy: Ledger active)
  3. `workspace_tasks_1790272254732.png` — Tab switch cross-fade (150ms) to Tasks
  4. `workspace_cash_drawer_1790272280024.png` — Center hub Cash Drawer
  5. `workspace_docs_1790272301392.png` — Document generation hub
  6. `workspace_settings_modal_1790272326622.png` — Settings bottom overlay (Recency: Settings tab)
  7. `fab_bottom_sheet_open_1790272389025.png` — Context-aware FAB triggered Bottom Sheet (3 snap points, drag pill, backdrop blur)
  8. `ledger_return_view_1790272493342.png` — Smooth return to Ledger with Pull-to-refresh & safe-area insets

---

## 2. UX Psychology Decision Matrix

| Principle | Mobile Shell Implementation | Verification Method |
| :--- | :--- | :--- |
| **Fitts's Law** | Primary CTA & FAB (56×56px) placed in the lower 33% thumb zone (`y ≥ 0.67 × viewportHeight`); all touch targets $\ge 44\times 44$px. | Automated Playwright test `tests/e2e/ux-psychology.spec.ts` (Test 1) passing on iPhone 15, Pixel 7, and Desktop Chrome. |
| **Hick's Law** | Bottom navigation limited strictly to 5 tabs (`Ledger`, `Tasks`, `Cash Drawer`, `Docs`, `Settings`); FAB radial actions strictly $\le 3$. | Automated Playwright test `tests/e2e/ux-psychology.spec.ts` (Test 2) asserting `tabCount === 5` and `radialItems <= 3`. |
| **Jakob's Law** | Standard mobile conventions (5-tab bottom navigation, scroll-hide top app bar, pull-to-refresh, bottom sheet drawer). | Evaluated via browser walkthrough and standard gesture interactions. |
| **Miller's Law** | Information chunking: max 5 active items per list before scrolling, progressive disclosure in sheets. | Component architecture in `components/mobile/EmptyState.tsx` & `BottomSheet.tsx`. |
| **Doherty Threshold** | Micro-animations and page transitions $\le 250$ms (`quick`: 150ms, `normal`: 220ms, `instant`: 80ms). Spinner only for operations $> 400$ms. | Automated Playwright test `tests/e2e/ux-psychology.spec.ts` (Test 5) validating CSS motion tokens $\le 250$ms. |
| **Peak-End Rule** | Error recovery states provide actionable recovery links (no dead-ends); success checkmark micro-interaction draws in 400ms. | `components/mobile/ErrorRecovery.tsx` & `MicroInteractions.tsx`. |
| **Tesler's Law** | Complexity handled by the system: auto-detection of online/offline status, auto-seeding sample projects, auto-retry sync. | Background sync queue & network status banner. |
| **Aesthetic-Usability** | Obsidian Canvas (`#050505`) with 14px surface radius, 0 drop shadows, and high contrast typography. | Verified across Obsidian, Signature, and Paper themes. |
| **Serial Position** | Tab 1 (Primacy) = `Ledger`; Tab 5 (Recency) = `Settings`. | Automated Playwright test `tests/e2e/ux-psychology.spec.ts` (Test 3). |
| **Von Restorff** | Electric Crimson reserved strictly for active tab highlight, primary CTA buttons, and notification badge dots. Inactive tabs styled in neutral stone. | Automated Playwright test `tests/e2e/ux-psychology.spec.ts` (Test 4). |

---

## 3. Real Device & Platform Matrix

- **iOS Safari (iPhone 15 / 390×844)**:
  - Safe area insets: `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]`.
  - Haptic feedback: Graceful silent fallback (WebKit does not expose `navigator.vibrate`).
  - Motion: Instant fade fallback when `prefers-reduced-motion: reduce` is enabled.
- **Android Chrome (Pixel 7 / 412×915)**:
  - Vibration API: Fully supported (10ms on tab switch, 20ms on FAB, 30ms on error).
  - Material 56×56px FAB ergonomics and gesture handling.
