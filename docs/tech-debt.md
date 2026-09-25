# Technical Debt Tracking Register — ClosedBook

**Last Updated**: 2026-09-25  
**Current Milestone**: Sub-Fase G.5 Complete  
**Governance**: ADR-001 through ADR-009

---

## Active Tracked Items

### DEBT-001: Next.js Static HTML Rendering vs Dynamic Middleware CSP (A2)
- **Origin**: G.0 / G.4 Architectural Review (A2)
- **Status**: Tracked & Documented in `ADR-009-hybrid-csp-static-rendering.md`
- **Description**: Next.js App Router marks routes using dynamic headers/cookies (`x-nonce`, iron-session, `headers()`) as dynamic (`ƒ Server-rendered on demand`). This provides high cryptographic security via nonce-based CSP, but prevents pure static HTML exports (`output: 'export'`).
- **Impact**: Zero runtime performance penalty on Node/Edge deployments; however, static offline-first assets must rely on Service Worker cache rather than raw SSG.
- **Resolution Plan**: Scheduled for Sub-Fase G.6/G.7/G.8. Evaluate hybrid static SSG with hash-based CSP or build-time script hashes for public routes while maintaining nonce-based CSP for authenticated production workspaces.

### DEBT-002: Tailwind PostCSS Typeless Package Warning
- **Origin**: Next.js 15.5 + Tailwind v4 build worker
- **Status**: Non-blocking warning (`[MODULE_TYPELESS_PACKAGE_JSON]`)
- **Description**: Next.js warns about `tailwind.config.ts` not parsed as CommonJS when `type: module` is not explicitly set in root `package.json`.
- **Resolution Plan**: Transition to pure ESM in `package.json` (`"type": "module"`) in a dedicated chore commit once all build scripts and Vitest ESM loaders are aligned.

### DEBT-003: Playwright Mobile Emulation LocalStorage Warning
- **Origin**: Node 20+ experimental `--localstorage-file` warning in test worker
- **Status**: Non-blocking test runner warning
- **Description**: Node prints a deprecation warning about `--localstorage-file` during jsdom/playwright test worker initialization.
- **Resolution Plan**: Suppress via `NODE_OPTIONS` or update to Node 22 LTS test runner flags.

### DEBT-004: Branch Structure Consolidation (Resolved)
- **Origin**: Pipeline Review (Prompt #20 - #22)
- **Status**: **RESOLVED** — Consolidated into `main-only` workflow.
- **Description**: Previous multi-branch structure (`develop`, `feat/g0` through `feat/g5`) accumulated cognitive overhead and potential merge drift.
- **Resolution**: All 6 milestone tags (`v0.1.0` to `v0.6.0-preview`) are permanently pinned. Local and remote auxiliary branches deleted. Single-branch continuous delivery on `main` is now standard.

