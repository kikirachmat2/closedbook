# ClosedBook
> **The Zero-Budget Production & Project Management OS**
> *Built on a pure black canvas for visual curators, filmmakers, and project leads.*

![ClosedBook Red Quill Icon](/public/icon.png)

---

## ✦ Overview

**ClosedBook** is an integrated production and project management operating system designed for high-velocity teams who refuse to pay monthly SaaS subscription fees.

Instead of renting costly cloud storage servers, ClosedBook pioneers the **Bring-Your-Own-Storage (BYOS)** architecture:
- **Receipts & Attachments** stream directly into the Project Owner's **Google Drive** (using their free 15 GB quota).
- **Master Records & Accounting** are automatically mirrored into **Google Sheets** for immediate access by accountants and executives.
- **ClosedBook Engine** (Next.js 15 + Supabase Free Tier) acts as a high-speed, noise-free controller for mobile logging, approval gates, task management, and contextual discussions.

If ClosedBook ever goes offline, **100% of your production records remain safely in your personal Google Drive and Sheets.**

---

## ✦ Design System: Savee Reference

ClosedBook is crafted with extreme aesthetic discipline, directly adopting the **Savee editorial design language**:

- **Obsidian Canvas (`#050505`)**: Pure near-total darkness where surfaces and content float without visual clutter.
- **Electric Crimson (`#ff1e42`)**: The sole chromatic accent in the system, reserved exclusively for the primary CTA button and active indicators.
- **Binary Radius Vocabulary**:
  - `9999px` (Pills) for all controls: buttons, tags, search inputs.
  - `14px` for all passive surfaces: cards, modals, preview frames.
- **Zero Drop Shadows**: Hierarchy is expressed purely via surface color stepping (`#050505` canvas → `#121212` elevated panel → `#181818` deep overlay).
- **Sculptural Typography**: 96px display headlines compressed with `0.94` line-height and `-0.045em` tracking.

---

## ✦ How It Works (The 4-Step Pipeline)

1. **Step 01: Google OAuth 2.0 PKCE** — Authenticate directly with Google. Zero passwords or database credential silos.
2. **Step 02: Autonomous Vault** — Automatically provisions structured directories in your Google Drive and creates the live Master Ledger spreadsheet.
3. **Step 03: Client-Side Compression** — Crew members snap receipts on mobile PWA. Photos are compressed locally to ~300KB and stripped of GPS/EXIF data in browser memory.
4. **Step 04: Dual-Stream Sync** — Media uploads directly into your Google Drive folder, while a formatted row appends instantly to your master Google Sheet.

---

## ✦ Data Sovereignty & Security

- **Zero Server Data Retention**: ClosedBook never hosts or stores your project files, invoices, or records on our servers. All physical assets reside strictly in your personal Google Workspace.
- **Sandboxed Permissions (`drive.file`)**: Restricted by Google security policies from reading or modifying any existing photos, emails, or personal documents.
- **Client-Side EXIF Stripping**: Location coordinates and camera telemetry are removed in client memory before network transit.
- **Enterprise-Grade Handshake**: AES-256 encrypted refresh handshakes and direct Google Identity validation.

---

## ✦ Quick Start

```bash
# Clone repository
git clone https://github.com/kikirachmat2/closedbook.git
cd closedbook

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✦ Live Production

- **URL**: [https://closedbook.vercel.app](https://closedbook.vercel.app)
- **Deployment**: Automatic continuous delivery from `main` via Vercel Edge Network
- **Security**: Nonce-based strict-dynamic CSP (ADR-003), HSTS, Zero Server Retention

## ✦ Releases

- [**v0.6.0 — Mobile Shell + Card-Based Lists**](https://github.com/kikirachmat2/closedbook/releases/tag/v0.6.0) (Stable)
- [**v0.5.0-mobile-shell**](https://github.com/kikirachmat2/closedbook/releases/tag/v0.5.0-mobile-shell)
- [**v0.4.0-design-system**](https://github.com/kikirachmat2/closedbook/releases/tag/v0.4.0-design-system)
- [**v0.3.0-pwa**](https://github.com/kikirachmat2/closedbook/releases/tag/v0.3.0-pwa)
- [**v0.2.0-data-engine**](https://github.com/kikirachmat2/closedbook/releases/tag/v0.2.0-data-engine)
- [**v0.1.0-foundation**](https://github.com/kikirachmat2/closedbook/releases/tag/v0.1.0-foundation)

## ✦ Tech Stack

- **Framework**: Next.js 15.5 App Router + React 19
- **Local Storage Engine**: Dexie.js (IndexedDB) with reactive hooks & dual-read cutover
- **CRDT & Sync**: Yjs document merging + append-only Google Drive delta synchronization
- **PWA & Offline**: Multi-tier Service Worker caching with update kill-switch
- **Mobile Animation**: Framer Motion (lazy-loaded motion component for minimal bundle footprint)
- **Virtualization**: TanStack Virtual v3 for 60fps 500+ long list performance
- **Styling**: Tailwind CSS v3 with Savee editorial design tokens & binary radius vocabulary
- **Testing**: Vitest (123 unit/integration tests) + Playwright (cross-browser mobile & desktop)

## ✦ Development Workflow (Main-Only)

- **Single Branch**: `main`
- **Continuous Deployment**: Every commit pushed directly to `main` auto-deploys to production Vercel ([closedbook.vercel.app](https://closedbook.vercel.app))
- **No Feature Branches / PR Overhead**: Zero merge friction, zero dangling PRs, streamlined continuous delivery.
- **Commit Convention**: Standard conventional commits (`type(scope): description`).

---

## ✦ License

MIT License — free for independent filmmakers, creators, and organizers worldwide.

