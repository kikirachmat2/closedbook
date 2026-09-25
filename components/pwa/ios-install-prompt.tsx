"use client";

// =========================================================================
// CLOSEDBOOK PRODUCTION OS — IOS PWA INSTALL EDUCATIONAL PROMPT
// =========================================================================

import React, { useState, useEffect } from "react";
import { Share, PlusSquare, X } from "lucide-react";

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // 1. Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    // 2. Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (!isIOS || isStandalone) {
      return;
    }

    // 3. Check dismiss count (max 2 times)
    const dismissCount = parseInt(
      localStorage.getItem("cb_ios_install_dismiss_count") || "0",
      10
    );

    if (dismissCount < 2) {
      // Show prompt after brief delay for smooth post-onboarding experience
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    const count = parseInt(
      localStorage.getItem("cb_ios_install_dismiss_count") || "0",
      10
    );
    localStorage.setItem("cb_ios_install_dismiss_count", String(count + 1));
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="Panduan Instalasi Aplikasi"
      className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative rounded-2xl border border-neutral-800 bg-[#0d0d0d]/95 p-5 shadow-2xl backdrop-blur-xl">
        <button
          onClick={handleDismiss}
          aria-label="Tutup panduan instalasi"
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF2A4D]/10 text-[#FF2A4D]">
            <PlusSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Pasang di Layar Utama (Home Screen)
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              Dapatkan performa offline optimal dan pengalaman layar penuh tanpa bilah peramban Safari.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/60 px-4 py-2.5 text-xs text-neutral-300">
          <span className="flex items-center gap-2">
            1. Ketuk tombol <Share className="h-4 w-4 text-blue-400" /> (Bagikan)
          </span>
          <span className="text-neutral-500">→</span>
          <span className="flex items-center gap-1.5 font-medium text-white">
            2. &ldquo;Add to Home Screen&rdquo;
          </span>
        </div>

        <button
          onClick={handleDismiss}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-neutral-800 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
        >
          Mengerti, Nanti Saja
        </button>
      </div>
    </aside>
  );
}
