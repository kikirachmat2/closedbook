"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Badge,
  Divider,
  Skeleton,
  Sheet,
  Toast,
} from "@/components/ui";

import { usePreferences, ThemeCode } from "@/lib/preferences";

const THEMES = ["obsidian", "signature", "indigo", "emerald", "amber", "paper"] as const;

export default function DesignSystemPage() {
  const { theme: currentTheme, setTheme } = usePreferences();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--cb-canvas)] text-[var(--cb-text-primary)] transition-colors duration-[var(--cb-motion-quick)]">
      {/* Skip to Content Link for A11y Keyboard Nav */}
      <a
        href="#main-content"
        tabIndex={0}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--cb-crimson)] focus:text-white focus:rounded-[var(--cb-radius-pill)]"
      >
        Skip to main content
      </a>

      <main
        id="main-content"
        data-hydrated={isMounted ? "true" : "false"}
        className="max-w-xl mx-auto px-4 py-8 space-y-10 cb-safe-bottom"
      >
        {/* Header & Theme Switcher */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="cb-micro uppercase tracking-wider text-[var(--cb-crimson)] font-semibold">
              Design System Showcase
            </span>
            <Badge variant="crimson">G.3 Verified</Badge>
          </div>
          <h1 className="cb-display-l font-normal text-[var(--cb-text-primary)]">
            ClosedBook Design System
          </h1>
          <p className="cb-body-m text-[var(--cb-text-secondary)]">
            Mobile-first typography scale, touch-compliant primitives, and UX psychology foundation.
          </p>

          {/* Theme Selector */}
          <div className="pt-2">
            <Label htmlFor="theme-selector">Active Theme</Label>
            <div className="flex flex-wrap gap-2 pt-2" id="theme-selector" role="radiogroup" aria-label="Theme selector">
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  role="radio"
                  aria-checked={currentTheme === theme}
                  onClick={() => setTheme(theme as ThemeCode)}
                  className={`min-h-[44px] px-3 py-2 rounded-[var(--cb-radius-pill)] text-[14px] font-medium transition-all ${
                    currentTheme === theme
                      ? "bg-[var(--cb-crimson)] text-white shadow-none"
                      : "bg-[var(--cb-surface)] text-[var(--cb-text-secondary)] border border-[var(--cb-border)] hover:text-[var(--cb-text-primary)]"
                  } cb-focus-ring`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </header>

        <Divider />

        {/* SECTION 1: TYPOGRAPHY SCALE & STRESS TESTING */}
        <section className="space-y-6" id="typography-stress-section">
          <div className="space-y-1">
            <h2 className="cb-h2 text-[var(--cb-text-primary)]">Typography Scale & Stress Test</h2>
            <p className="cb-caption text-[var(--cb-text-secondary)]">
              Tested against long Indonesian titles, large IDR currencies, and CJK multilingual text.
            </p>
          </div>

          <Card className="space-y-6" data-testid="stress-card">
            {/* Display XL */}
            <div className="space-y-1 border-b border-[var(--cb-border)] pb-4">
              <span className="cb-micro text-[var(--cb-text-tertiary)] uppercase">Display XL (36px / 40px / 700)</span>
              <p className="cb-display-xl break-words" data-testid="stress-display-xl">
                The Quiet Horizon: A Requiem for Lost Time (Expanded Edition)
              </p>
            </div>

            {/* Display L */}
            <div className="space-y-1 border-b border-[var(--cb-border)] pb-4">
              <span className="cb-micro text-[var(--cb-text-tertiary)] uppercase">Display L (30px / 36px / 700)</span>
              <p className="cb-display-l break-words" data-testid="stress-display-l">
                Pengeluaran Operasional Departemen Produksi
              </p>
            </div>

            {/* H1 & Currency Stress */}
            <div className="space-y-1 border-b border-[var(--cb-border)] pb-4">
              <span className="cb-micro text-[var(--cb-text-tertiary)] uppercase">H1 (24px / 30px / 600) + Currency Mono</span>
              <h3 className="cb-h1 text-[var(--cb-text-primary)]" data-testid="stress-h1">
                Total Anggaran Proyek
              </h3>
              <p className="cb-h1 cb-mono text-[var(--cb-crimson)] font-bold tracking-tight" data-testid="stress-currency">
                Rp 999.999.999.999
              </p>
            </div>

            {/* H2, H3 */}
            <div className="space-y-2 border-b border-[var(--cb-border)] pb-4">
              <span className="cb-micro text-[var(--cb-text-tertiary)] uppercase">H2 (20px) & H3 (18px)</span>
              <p className="cb-h2 text-[var(--cb-text-primary)]">Fase Pasca-Produksi & Distribusi Master</p>
              <p className="cb-h3 text-[var(--cb-text-secondary)]">Sub-departemen Sound Design & Grading</p>
            </div>

            {/* Multilingual / CJK / Emoji Stress */}
            <div className="space-y-1 border-b border-[var(--cb-border)] pb-4">
              <span className="cb-micro text-[var(--cb-text-tertiary)] uppercase">Multilingual CJK & Emoji Fallback</span>
              <p className="cb-body-l text-[var(--cb-text-primary)]" data-testid="stress-cjk">
                Vendor: 東京プロダクション (Tokyo Production) 🎬 — 音響制作とマスタリング
              </p>
            </div>

            {/* Body Tiers */}
            <div className="space-y-2">
              <span className="cb-micro text-[var(--cb-text-tertiary)] uppercase">Body Tiers (17px / 16px iOS anti-zoom / 15px / 13px / 11px)</span>
              <p className="cb-body-l text-[var(--cb-text-primary)]">Body L: Teks paragraf utama editorial untuk kenyamanan membaca di mobile.</p>
              <p className="cb-body-m text-[var(--cb-text-secondary)]">Body M: Minimum ukuran form input (16px) guna mencegah iOS auto-zoom.</p>
              <p className="cb-body-s text-[var(--cb-text-tertiary)]">Body S: Keterangan tambahan atau catatan footnote.</p>
              <p className="cb-caption text-[var(--cb-text-tertiary)]">Caption: Metadata timestamp 23 September 2026, 21:00 WIB</p>
              <p className="cb-micro text-[var(--cb-text-secondary)] uppercase">Micro: 11px Badge & Status Label</p>
            </div>
          </Card>
        </section>

        <Divider />

        {/* SECTION 2: BUTTON VARIANTS & TOUCH TARGET (FITTS'S LAW) */}
        <section className="space-y-6" id="button-section">
          <div className="space-y-1">
            <h2 className="cb-h2 text-[var(--cb-text-primary)]">Button System & Touch Targets</h2>
            <p className="cb-caption text-[var(--cb-text-secondary)]">
              WCAG 2.5.5 minimum 44×44px, instant 80ms active feedback, 2px offset crimson focus ring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              data-testid="btn-primary"
              onClick={() => setClickCount((c) => c + 1)}
            >
              Primary Crimson ({clickCount})
            </Button>
            <Button variant="secondary" data-testid="btn-secondary">
              Secondary Surface
            </Button>
            <Button variant="ghost" data-testid="btn-ghost">
              Ghost Pill
            </Button>
            <Button variant="icon" aria-label="Tambah item" data-testid="btn-icon">
              <svg className="cb-icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        </section>

        <Divider />

        {/* SECTION 3: FORM INPUTS (16PX ANTI-ZOOM & ACCESSIBILITY) */}
        <section className="space-y-6" id="form-section">
          <div className="space-y-1">
            <h2 className="cb-h2 text-[var(--cb-text-primary)]">Form Inputs & Validation</h2>
            <p className="cb-caption text-[var(--cb-text-secondary)]">
              Enforced 16px font size to eliminate iOS Safari focus zoom viewport jumping.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name-input" isRequired>
                Nama Proyek (Stress Testing)
              </Label>
              <Input
                id="project-name-input"
                data-testid="input-project"
                defaultValue="The Quiet Horizon: A Requiem for Lost Time"
                placeholder="Masukkan judul proyek"
              />
            </div>

            <div>
              <Label htmlFor="nominal-input">Nominal Anggaran</Label>
              <Input
                id="nominal-input"
                data-testid="input-amount"
                defaultValue="999999999999"
                placeholder="Rp 0"
              />
            </div>

            <div>
              <Label htmlFor="error-input" isRequired>
                Status Error Validation
              </Label>
              <Input
                id="error-input"
                isError
                defaultValue="Nilai tidak boleh melebihi plafon kas"
                placeholder="Field with error"
              />
            </div>
          </div>
        </section>

        <Divider />

        {/* SECTION 4: ICON SIZING TOKENS */}
        <section className="space-y-4" id="icons-section">
          <div className="space-y-1">
            <h2 className="cb-h2 text-[var(--cb-text-primary)]">Standardized Icon Tokens</h2>
            <p className="cb-caption text-[var(--cb-text-secondary)]">
              --cb-icon-sm (16px), md (20px), lg (24px), xl (32px), hero (48px).
            </p>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-[var(--cb-radius-surface)] bg-[var(--cb-surface)] border border-[var(--cb-border)]">
            <div className="flex flex-col items-center gap-1">
              <svg className="cb-icon-sm text-[var(--cb-crimson)]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="cb-micro text-[var(--cb-text-tertiary)]">16px</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="cb-icon-md text-[var(--cb-crimson)]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="cb-micro text-[var(--cb-text-tertiary)]">20px</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="cb-icon-lg text-[var(--cb-crimson)]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="cb-micro text-[var(--cb-text-tertiary)]">24px</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="cb-icon-xl text-[var(--cb-crimson)]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="cb-micro text-[var(--cb-text-tertiary)]">32px</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="cb-icon-hero text-[var(--cb-crimson)]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="cb-micro text-[var(--cb-text-tertiary)]">48px</span>
            </div>
          </div>
        </section>

        <Divider />

        {/* SECTION 5: MODAL & SHEET INTERACTION */}
        <section className="space-y-4" id="sheet-section">
          <div className="space-y-1">
            <h2 className="cb-h2 text-[var(--cb-text-primary)]">Interactive Primitives</h2>
            <p className="cb-caption text-[var(--cb-text-secondary)]">
              Bottom Sheet modal and Toast notifications.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="secondary"
              data-testid="open-sheet-btn"
              onClick={() => setIsSheetOpen(true)}
            >
              Buka Bottom Sheet Preview
            </Button>

            {showToast && (
              <Toast
                variant="success"
                message="Data Desain Tersinkronisasi"
                description="Token visual siap untuk implementasi G.4 Mobile Shell."
                onClose={() => setShowToast(false)}
              />
            )}

            <div className="pt-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          {/* Bottom Sheet Component */}
          <Sheet
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            title="Pratinjau Lembar Detail"
          >
            <div className="space-y-4">
              <p className="cb-body-m text-[var(--cb-text-secondary)]">
                Ini adalah placeholder bottom sheet G.3 dengan focus trap, ESC handler, dan role dialog. Implementasi swipe gesture penuh akan dirilis di G.4.
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setIsSheetOpen(false)}
              >
                Tutup Lembar
              </Button>
            </div>
          </Sheet>
        </section>
      </main>
    </div>
  );
}
