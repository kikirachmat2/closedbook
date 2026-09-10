"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, Download, RefreshCw, X, Check } from "lucide-react";
import { usePreferences } from "@/lib/preferences";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaManager() {
  const { t } = usePreferences();
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnlineToast, setShowBackOnlineToast] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [hasDismissedInstall, setHasDismissedInstall] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  // 1. Service Worker Registration & Update Lifecycle
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Guard: Only register in production OR explicit test parameter (?pwa=true)
    const isProduction = process.env.NODE_ENV === "production";
    const isExplicitTest = window.location.search.includes("pwa=true");

    if (isProduction || isExplicitTest) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for waiting worker
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdateToast(true);
          }

          // Listen for new worker updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdateToast(true);
              }
            });
          });
        })
        .catch((err) => {
          console.warn("[PWA] Service worker registration failed:", err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  // 2. Connectivity Listeners (Online / Offline)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnlineToast(true);
      const timer = setTimeout(() => setShowBackOnlineToast(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBackOnlineToast(false);
    };

    // Set initial status
    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. PWA Install Prompt Capture
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

  // Handler: Apply Update
  const handleApplyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    setShowUpdateToast(false);
  }, [waitingWorker]);

  return (
    <>
      {/* 1. OFFLINE INDICATOR (Persistent when offline) */}
      {isOffline && (
        <div
          id="pwa-offline-indicator"
          role="status"
          aria-live="polite"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1c1917] border border-amber-500/40 text-amber-300 text-xs font-medium shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t("offlineMode")}</span>
          <span className="text-[10px] text-amber-400/70 hidden sm:inline border-l border-amber-500/30 pl-2">
            {t("offlineModeDesc")}
          </span>
        </div>
      )}

      {/* 2. BACK ONLINE TOAST (Temporary when reconnecting) */}
      {showBackOnlineToast && (
        <div
          id="pwa-back-online-indicator"
          role="status"
          aria-live="polite"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#064e3b]/90 border border-emerald-500/40 text-emerald-200 text-xs font-medium shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{t("backOnline")}</span>
        </div>
      )}

      {/* 3. PWA UPDATE BANNER */}
      {showUpdateToast && (
        <div
          id="pwa-update-toast"
          role="alert"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm p-3.5 rounded-[16px] bg-[#121212] border border-[var(--color-primary,#ff1e42)]/40 shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary,#ff1e42)]/20 flex items-center justify-center text-[var(--color-primary,#ff1e42)] shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#fdfdfd] truncate">
                {t("updateAvailable")}
              </div>
              <p className="text-[10px] text-[#737373] truncate">
                {t("updateAvailableDesc")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleApplyUpdate}
              id="btn-apply-pwa-update"
              className="px-3 py-1.5 rounded-lg bg-[var(--color-primary,#ff1e42)] hover:opacity-90 text-white text-[11px] font-medium transition-opacity cursor-pointer"
            >
              {t("reloadToUpdate")}
            </button>
            <button
              onClick={() => setShowUpdateToast(false)}
              className="p-1.5 rounded-lg text-[#737373] hover:text-white transition-colors"
              aria-label="Dismiss update"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. PWA INSTALL BANNER / PILL */}
      {isInstallable && !hasDismissedInstall && (
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
      )}
    </>
  );
}
