"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { requestStoragePersistence } from "@/lib/pwa/storage-persistence";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * PwaManager: Centralized orchestrator for:
 * 1. SW registration in production
 * 2. Native Android / Chromium `beforeinstallprompt` capture
 * 3. Automatic storage persistence invocation on install
 */
export default function PwaManager() {
  const { t } = usePreferences();
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [hasDismissedInstall, setHasDismissedInstall] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Service Worker Registration
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isProduction = process.env.NODE_ENV === "production";
    const isExplicitTest = window.location.search.includes("pwa=true");

    if (isProduction || isExplicitTest) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          // If already in standalone mode, request persistent storage proactively
          const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;
          if (isStandalone) {
            requestStoragePersistence();
          }
        })
        .catch((err) => {
          console.warn("[PWA] Service worker registration failed:", err);
        });
    }
  }, []);

  // 2. Native Install Prompt Capture (Chromium / Android)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      // Auto-trigger storage persistence when user installs app
      requestStoragePersistence();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Handler: Install PWA
  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!mounted) return null;

  // Native Chromium / Android Install Pill
  if (isInstallable && !hasDismissedInstall) {
    return (
      <div
        id="pwa-install-banner"
        className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 max-w-xs p-3 rounded-[16px] bg-[#121212]/95 border border-white/[0.1] shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[var(--color-primary,#ff1e42)] shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#fdfdfd] truncate">
              {t("installApp")}
            </div>
            <p className="text-[10px] text-[#737373] truncate">
              Offline Desktop & Mobile App
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleInstallClick}
            id="btn-install-pwa"
            className="btn-primary-crimson text-xs min-h-[32px] px-2.5 py-1 text-[11px] font-medium cursor-pointer"
          >
            {t("installApp")}
          </button>
          <button
            onClick={() => setHasDismissedInstall(true)}
            className="p-1 rounded-lg text-[#737373] hover:text-white transition-colors"
            aria-label="Dismiss install"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
