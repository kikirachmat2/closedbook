# ADR-009: Hybrid CSP — Static Rendering for Public Routes, Nonce for Dynamic Routes

**Status**: Accepted  
**Date**: 2026-09-25  
**Deciders**: Executor + Director  
**Related**: ADR-003 (Hybrid CSP Design), middleware.ts, app/layout.tsx

---

## Context

### The Problem

ClosedBook's `middleware.ts` generates a per-request cryptographic `nonce` and injects it into the `x-nonce` request header. The root `app/layout.tsx` reads this header via `headers()` — a **Dynamic API** in Next.js 15. This causes **every route** to be rendered dynamically (`ƒ Dynamic`), even routes with entirely static content like `/privacy`, `/terms`, and `/offline`.

**G.4 build output (pre-fix):**
```
Route (app)              Size    First Load JS
ƒ /                      8.13 kB     139 kB
ƒ /privacy                180 B      107 kB
ƒ /terms                  180 B      107 kB
ƒ /workspace             46.4 kB     255 kB
```

All routes are `ƒ` (Dynamic). Static routes should be `○` (Static) with zero server compute.

### Root Cause

```typescript
// app/layout.tsx — forces entire route tree to be Dynamic
const nonce = (await headers()).get("x-nonce") || undefined;
```

Next.js 15 calls `headers()` at the Root Layout level. Since all routes share the Root Layout, all routes inherit the dynamic rendering constraint.

---

## Decision: Hybrid CSP Architecture — Phased

### Phase 1 (G.4 → G.5) — CURRENT: Document & Accept

Accept dynamic rendering as-is. The nonce still enforces `strict-dynamic` CSP correctly. The overhead is TTFB only — no impact on First Load JS bundle size.

**Justification**: Separating the Root Layout into route groups (`(public)/` vs `(app)/`) requires re-validating all 93 Playwright tests across routing changes — deferred to G.6/G.7.

### Phase 2 (G.6/G.7) — Route Group Refactor

Restructure to:
```
app/
  (public)/           # Static — no nonce, renders as ○
    privacy/layout.tsx
    terms/layout.tsx
    offline/layout.tsx
  (app)/              # Dynamic — nonce required, renders as ƒ
    workspace/layout.tsx  ← uses headers() + x-nonce
  layout.tsx          # Minimal root (fonts + metadata only) — static
```

### Phase 3 (G.8) — Validate

- Confirm public routes are `○` (Static) in build output
- LHCI confirms TTFB < 100ms for public routes
- CSP enforcement still passes on workspace routes

---

## Alternatives Rejected

| Alternative | Reason Rejected |
|---|---|
| Remove nonce from Root Layout, use header-only CSP | Next.js 15 inline hydration script breaks without nonce attribute; browser blocks React hydration |
| Static CSP hash in next.config.ts | Framework scripts change on every build; hash maintenance impractical |
| Middleware skip for static routes | Middleware cannot distinguish "will be static" vs "will be dynamic" at route time |

---

## Consequences

**Accepted (Phase 1)**: Dynamic rendering for all routes — TTFB overhead only, no bundle size impact. 93 Playwright tests remain valid.

**Future (Phase 2)**: Public routes served from CDN as static HTML, TTFB < 50ms, reduced serverless cost.

---

## References

- [Next.js 15 CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [ADR-003: Hybrid CSP Design](./ADR-003-hybrid-csp.md)
- [Next.js Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
