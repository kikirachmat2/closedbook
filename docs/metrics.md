# ClosedBook Performance & Bundle Metrics Methodology

Dokumen ini mendefinisikan standar pengukuran bundle, ukuran payload over-the-wire, dan metrik performa runtime untuk ClosedBook antar sub-fase (G.0 s/d G.8).

---

## 1. Tiga Tingkat Metodologi Bundle Size

Untuk menghilangkan ambiguitas antara ukuran chunk rute spesifik, shared vendor, dan total transfer over-the-wire, ClosedBook menetapkan 3 lapisan metrik:

### (a) Layer A — Route Chunk Only (Isolated Route JavaScript)
- **Definisi**: Ukuran file JavaScript yang dihasilkan khusus untuk rute tersebut (misal: chunk `app/workspace/page.tsx`), tidak termasuk shared runtime atau vendor chunk.
- **Tooling**: Next.js build output column `Size` (atau `@next/bundle-analyzer` isolated route bundle).
- **Target Budget**:
  - `/` (Home): $< 25\text{ KB}$ gzipped
  - `/workspace`: $< 60\text{ KB}$ gzipped (Budget per ADR / G.1 clarification)
  - `/offline`: $< 10\text{ KB}$ gzipped
  - Legal (`/privacy`, `/terms`): $< 5\text{ KB}$ gzipped

### (b) Layer B — First Load JS (Route Chunk + Shared Vendor Chunks)
- **Definisi**: Total JavaScript yang harus diunduh dan dieksekusi pada first visit ke rute tersebut saat browser cache kosong. Terdiri dari Layer A + Shared Runtime Chunks (Next.js framework, React 19, Lucide, Dexie, Tailwind runtime).
- **Tooling**: Next.js build output column `First Load JS`.
- **Target Budget**:
  - First Load JS shared by all: $< 120\text{ KB}$ gzipped
  - `/workspace` First Load JS: $< 250\text{ KB}$ gzipped

### (c) Layer C — Full First Paint (Wire Transfer Size)
- **Definisi**: Total transfer data over-the-wire terkompresi (gzipped/brotli) untuk merender halaman sampai First Contentful Paint (FCP) / Largest Contentful Paint (LCP). Meliputi HTML dokumen awal, CSS stylesheet, fonts woff2, dan initial script hydration.
- **Tooling**: Lighthouse CI audit `total-byte-weight` / Playwright network idle transfer counter.
- **Target Budget**:
  - Public static routes (`/`, `/privacy`, `/terms`): $< 80\text{ KB}$ gzipped transfer
  - App shell (`/workspace`): $< 260\text{ KB}$ gzipped transfer

---

## 2. Baseline Historis & Progresi (G.0 s/d G.2)

| Sub-Fase | Rute | (a) Route Chunk | (b) First Load JS | (c) Full First Paint | Lighthouse Perf | Lighthouse A11y | Lighthouse Best Practices |
|---|---|---|---|---|---|---|---|
| **G.0 Foundation** | `/` | 7.9 KB | 134 KB | ~68 KB | 100 | 91 *(missing label)* | 100 |
| **G.0 Foundation** | `/privacy`, `/terms` | 178 B | 107 KB | ~45 KB | 100 | 100 | 100 |
| **G.1 Data Engine** | `/workspace` | 37.6 KB | 198.6 KB | ~215 KB | 97 | 96 | 100 |
| **G.2 PWA Hardening** | `/workspace` | **41.9 KB** | **234 KB** | **~240 KB** | **98** | **96** | **100** |
| **G.2 PWA Hardening** | `/offline` | **2.45 KB** | **110 KB** | **~55 KB** | **100** | **100** | **100** |
| **G.2 PWA Hardening** | `/` (Home) | **8.08 KB** | **138 KB** | **~71 KB** | **100** | **96** | **100** |
| **G.2 PWA Hardening** | `/privacy`, `/terms` | **178 B** | **107 KB** | **~45 KB** | **100** | **100** | **100** |

*Catatan: Nilai G.2 diukur dari Next.js 15.5.25 production build (`npm run build`) dan Lighthouse CI autorun pada 23 September 2026.*

---

## 3. Forward Target Thresholds (G.3 s/d G.8)

Untuk mencegah degradasi performa seiring penambahan fitur mobile, kartu interaktif, generator dokumen, Gemini AI, dan WebAuthn, batas toleransi ketat ditetapkan sebagai berikut:

| Fase | Fokus Arsitektur | Max Route Chunk (Layer A) | Max First Load JS (Layer B) | Min LH Perf | Min LH A11y |
|---|---|---|---|---|---|
| **G.3** | Mobile Design System & Tokens | $< 45\text{ KB}$ | $< 240\text{ KB}$ | $\ge 95$ | $\ge 95$ |
| **G.4** | Mobile Shell & Navigation | $< 50\text{ KB}$ | $< 245\text{ KB}$ | $\ge 95$ | $\ge 95$ |
| **G.5** | Card-Based Lists & Gestures | $< 55\text{ KB}$ | $< 250\text{ KB}$ | $\ge 95$ | $\ge 95$ |
| **G.6** | Document Generation (Drive/Sheets) | $< 60\text{ KB}$ | $< 260\text{ KB}$ | $\ge 95$ | $\ge 95$ |
| **G.7** | Gemini AI Assistants (Tier 1 & 2) | $< 65\text{ KB}$ *(Dynamic Import)* | $< 270\text{ KB}$ | $\ge 90$ | $\ge 95$ |
| **G.8** | WebAuthn & Hardening | $< 60\text{ KB}$ | $< 265\text{ KB}$ | $\ge 95$ | $\ge 95$ |

---

## 4. Protokol Verifikasi Regresi

1. Setiap PR wajib menjalankan `npm run build` dan mencatat Layer A & Layer B.
2. Jika `/workspace` Layer A $\ge 60\text{ KB}$ gzipped, PR otomatis **ditolak** atau wajib menyertakan tree-shaking / dynamic import refactor.
3. LHCI runs mengawasi budget resource script $\le 310\text{ KB}$ uncompressed dan enforcement Zero-Error di browser console.
