# ClosedBook Design Tokens Specification (G.3)

Spesifikasi token desain ClosedBook yang menjadi acuan styling mobile-first di seluruh modul (G.4 – G.8).

---

## 1. Color Tokens (Obsidian Canvas)

| Token Name | CSS Variable | Hex / Value | Deskripsi & Penggunaan |
|---|---|---|---|
| **Canvas** | `--cb-canvas` | `#050505` | Background kanvas terdalam (root background) |
| **Surface** | `--cb-surface` | `#0D0D0D` | Kartu konten, card base, list containers |
| **Elevated Surface** | `--cb-surface-elevated` | `#141414` | Modal dialog, bottom sheets, popovers |
| **Electric Crimson** | `--cb-crimson` | `#FF2A4D` | Aksen primer, interactive buttons, active indicators |
| **Crimson Hover** | `--cb-crimson-hover` | `#E02040` | State hover tombol primer |
| **Text Primary** | `--cb-text-primary` | `#FDFDFD` | Teks judul, label utama, angka saldo (AAA) |
| **Text Secondary** | `--cb-text-secondary` | `#A3A3A3` | Sub-judul, metadata deskripsi (AAA) |
| **Text Tertiary** | `--cb-text-tertiary` | `#858585` | Placeholder input, timestamps, captions (AA) |
| **Border Active** | `--cb-border` | `rgba(255, 255, 255, 0.08)` | Garis pembatas kartu & tombol sekunder |
| **Border Subtle** | `--cb-border-subtle` | `rgba(255, 255, 255, 0.04)` | Garis pembatas subtle dalam tabel |
| **Border Focus** | `--cb-border-focus` | `#FF2A4D` | Focus ring outline 2px |
| **Success** | `--cb-success` | `#10B981` | Status tersinkron, transaksi disetujui |
| **Warning** | `--cb-warning` | `#F59E0B` | Peringatan offline, peringatan budget over |
| **Error / Danger** | `--cb-error` | `#EF4444` | Hapus data, kegagalan jaringan |

---

## 2. Spacing Scale (Fibonacci-based)

| Token | CSS Variable | Rem | Pixel Equivalent |
|---|---|---|---|
| `space-1` | `--cb-space-1` | `0.25rem` | `4px` |
| `space-2` | `--cb-space-2` | `0.5rem` | `8px` |
| `space-3` | `--cb-space-3` | `0.75rem` | `12px` |
| `space-4` | `--cb-space-4` | `1.0rem` | `16px` |
| `space-6` | `--cb-space-6` | `1.5rem` | `24px` |
| `space-8` | `--cb-space-8` | `2.0rem` | `32px` |
| `space-12` | `--cb-space-12` | `3.0rem` | `48px` |
| `space-16` | `--cb-space-16` | `4.0rem` | `64px` |

---

## 3. Binary Radii Scale (ADR-007)

| Token | CSS Variable | Pixel | Penggunaan |
|---|---|---|---|
| **Inner Radius** | `--cb-radius-inner` | `8px` | Input fields, badge pills, segmented controls |
| **Surface Radius** | `--cb-radius-surface` | `14px` | Kartu (Card), panels, bottom sheets |
| **Control Pill** | `--cb-radius-pill` | `9999px` | Tombol CTA (Primary, Secondary, Ghost) |

---

## 4. Typography Scale (10-Tier Mobile Scale)

| Tier | Ukuran / Line Height | Bobot | Tracking | Penggunaan |
|---|---|---|---|---|
| **Display XL** | 36px / 40px | 700 | -0.02em | Hero onboarding & zero-state |
| **Display L** | 30px / 36px | 700 | -0.02em | Judul halaman utama |
| **H1** | 24px / 30px | 600 | -0.01em | Judul seksi utama |
| **H2** | 20px / 26px | 600 | -0.01em | Judul kartu & modal |
| **H3** | 18px / 24px | 500 | 0.00em | Sub-seksi |
| **Body L** | 17px / 24px | 400 | 0.00em | Default body iOS |
| **Body M** | 16px / 22px | 400 | 0.00em | Standard input text (anti-zoom) |
| **Body S** | 15px / 20px | 400 | 0.00em | Catatan pendukung |
| **Caption** | 13px / 18px | 500 | +0.01em | Metadata & timestamp |
| **Micro** | 11px / 14px | 600 | +0.02em | Badges & status pills |

---

## 5. Crimson Brand Variants per Theme (ADR-008)

Untuk memastikan kepatuhan terhadap standar rasio kontras WCAG 2.1 AA di seluruh tema (khususnya tema terang *Paper*), token `--cb-crimson` dikalibrasi secara deterministik per tema:

| Theme | Canvas | Surface | Calibrated Accent Token | Hover Token | Contrast on Surface | White Text on Button | WCAG Status |
|---|---|---|---|---|---|---|---|
| **Obsidian** (Default) | `#050505` | `#0E0E0E` | `#FF1E42` / `#FF2A4D` | `#FF3355` | 3.69:1 (ADR-007) | 3.69:1 | AA (Semibold / Large) |
| **Signature** | `#050505` | `#0D0D0D` | `#FF2A4D` | `#E02040` | 3.69:1 (ADR-007) | 3.69:1 | AA (Semibold / Large) |
| **Indigo** | `#04050A` | `#0D111D` | `#3B82F6` (Blue 500) | `#60A5FA` | 4.82:1 | 3.91:1 | AA |
| **Emerald** | `#030805` | `#0A140F` | `#10B981` (Emerald 500) | `#34D399` | 6.54:1 | 3.12:1 | AA |
| **Amber** | `#090704` | `#16120A` | `#F59E0B` (Amber 500) | `#FBBF24` | 7.91:1 | 2.18:1 (dark text) | AA |
| **Paper** (Light Mode) | `#F8F9FA` | `#FFFFFF` | `#BE123C` (Rose 700) | `#9F1239` | **6.32:1** | **6.32:1** | **AA Pass ($\ge 4.5:1$)** |

---

## 6. Standardized Icon Sizing Scale

| Token | CSS Variable | Pixel | Penggunaan |
|---|---|---|---|
| **Icon XS** | `--cb-icon-xs` | `12px` | Micro-indicators, badge dots, status flags |
| **Icon SM** | `--cb-icon-sm` | `16px` | Metadata inline, timestamp tags, list bullets |
| **Icon MD** | `--cb-icon-md` | `20px` | Tombol aksi (Buttons), input prefixes/suffixes |
| **Icon LG** | `--cb-icon-lg` | `24px` | Navigasi bawah (Bottom Nav), Top App Bar actions |
| **Icon XL** | `--cb-icon-xl` | `32px` | Feature cards, category avatars |
| **Icon 2XL / Hero**| `--cb-icon-2xl` | `48px` | Empty state hero visual, onboarding anchors |

---

## 7. Motion Tokens (NN/g 2024 & Mobile Touch Standards)

| Token | Semantic Alias | Durasi | UX Psychology & Penggunaan |
|---|---|---|---|
| `--cb-motion-instant` | `--cb-motion-press` | `80ms` | Button active press & haptic feedback instant |
| `--cb-motion-quick` | `--cb-motion-tap` | `150ms` | Tap feedback & micro-interactions (< 150ms NN/g) |
| `--cb-motion-normal` | `--cb-motion-slide` | `220ms` | Navigation slide & bottom sheet expansion (iOS standard) |
| `--cb-motion-slow` | `--cb-motion-modal` | `320ms` | Modal dialog entrance & backdrop fade |

### Accessibility: Reduced Motion
Sistem mematuhi `@media (prefers-reduced-motion: reduce)`. Ketika pengguna mengaktifkan "Reduce Motion" (iOS) atau "Remove Animations" (Android), seluruh durasi animasi otomatis diset ke `0.01ms` (instant switch), memastikan nol disorientasi visual bagi pengguna sensitif gerak.
