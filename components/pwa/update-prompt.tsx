"use client";

import React, { useState, useEffect } from "react";
import { useServiceWorkerUpdate } from "@/lib/hooks/use-service-worker-update";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { RefreshCw, Sparkles, X } from "lucide-react";

export function UpdatePrompt() {
  const [mounted, setMounted] = useState(false);
  const { updateAvailable, isUpdating, applyUpdate, dismissUpdate } =
    useServiceWorkerUpdate();
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: Never prompt update while offline to prevent loading incomplete cache
  if (!mounted || !updateAvailable || !isOnline) return null;

  return (
    <aside
      aria-label="Pembaruan Aplikasi"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="bg-[#0D0D0D] border border-[#FF2A4D]/30 rounded-2xl p-4 shadow-2xl shadow-black/80 flex flex-col gap-3 backdrop-blur-md relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF2A4D]/10 border border-[#FF2A4D]/20 flex items-center justify-center text-[#FF2A4D] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Versi Baru Tersedia</h2>
              <p className="text-xs text-stone-400">
                Pembaruan ClosedBook siap dimuat untuk stabilitas terbaru.
              </p>
            </div>
          </div>
          <button
            onClick={dismissUpdate}
            aria-label="Tutup notifikasi pembaruan"
            className="text-stone-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={applyUpdate}
            disabled={isUpdating}
            className="flex-1 py-2 px-3 rounded-xl bg-[#FF2A4D] hover:bg-[#e02040] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
            <span>{isUpdating ? "Memuat Ulang..." : "Muat Ulang Sekarang"}</span>
          </button>
          <button
            onClick={dismissUpdate}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 text-xs font-medium transition-colors"
          >
            Nanti
          </button>
        </div>
      </div>
    </aside>
  );
}
