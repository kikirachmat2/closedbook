"use client";

import React, { useState, useEffect } from "react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useSyncEngine } from "@/lib/sync/engine";
import { WifiOff, CheckCircle2, RefreshCw, AlertCircle, X } from "lucide-react";

export function OfflineBanner() {
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { isOnline, wasOffline } = useOnlineStatus();
  const { pendingCount } = useSyncEngine();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-dismiss banner after 6 seconds on mobile to avoid blocking content
  useEffect(() => {
    if (!isOnline) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(false);
    }
  }, [isOnline]);

  if (!mounted) return null;

  return (
    <>
      {/* 1. Offline Notification Bar (Sticky Top with auto-hide / manual dismiss) */}
      {!isOnline && !isDismissed && (
        <div
          id="offline-sticky-banner"
          role="status"
          aria-live="polite"
          className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-300 text-xs font-medium flex items-center justify-between gap-2 backdrop-blur-md sticky top-0 z-40 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Kamu offline. Perubahan tersimpan di perangkat dan akan disinkronkan saat online.
            </span>
            {pendingCount > 0 && (
              <span className="bg-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-200 shrink-0">
                {pendingCount} tertunda
              </span>
            )}
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-300/70 hover:text-amber-200 transition-colors shrink-0"
            aria-label="Tutup pemberitahuan offline"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Reconnected Notification Bar */}
      {isOnline && wasOffline && (
        <div
          id="reconnected-sticky-banner"
          role="status"
          aria-live="polite"
          className="w-full bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 backdrop-blur-md sticky top-0 z-40 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Koneksi pulih. Sinkronisasi otomatis ke Google Drive dimulai...</span>
        </div>
      )}
    </>
  );
}

/**
 * Compact Sync Status Badge for headers / navigation shells.
 */
export function SyncStatusIndicator() {
  const [mounted, setMounted] = useState(false);
  const { status, pendingCount } = useSyncEngine();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-stone-400">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[11px] font-medium hidden sm:inline">Tersinkron</span>
      </div>
    );
  }

  if (status === "syncing") {
    return (
      <div
        id="sync-status-indicator"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-stone-300"
        title="Sedang menyinkronkan data..."
      >
        <RefreshCw className="w-3 h-3 text-[#FF2A4D] animate-spin" />
        <span className="text-[11px] font-medium hidden sm:inline">Sinkronisasi...</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div
        id="sync-status-indicator"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
        title="Mode Offline: Data tersimpan lokal"
      >
        <WifiOff className="w-3 h-3 text-amber-400" />
        <span className="text-[11px] font-medium hidden sm:inline">
          Offline {pendingCount > 0 ? `(${pendingCount})` : ""}
        </span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        id="sync-status-indicator"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400"
        title="Gagal sinkronisasi. Coba lagi."
      >
        <AlertCircle className="w-3 h-3 text-red-400" />
        <span className="text-[11px] font-medium hidden sm:inline">Gagal Sinkron</span>
      </div>
    );
  }

  // Idle / Synced
  return (
    <div
      id="sync-status-indicator"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-stone-400 hover:text-stone-300 transition-colors"
      title="Semua data tersinkron"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span className="text-[11px] font-medium hidden sm:inline">Tersinkron</span>
    </div>
  );
}
