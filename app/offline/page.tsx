"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, ArrowLeft, Database, ShieldCheck } from "lucide-react";

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.href = "/workspace";
      } else {
        setIsChecking(false);
      }
    }, 600);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col items-center justify-center p-6 selection:bg-[#FF2A4D] selection:text-white">
      <div className="w-full max-w-md bg-[#0D0D0D] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#FF2A4D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#FF2A4D]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Status Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-[#FF2A4D]">
          <WifiOff className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-[#FF2A4D] mb-2 font-semibold">
          Offline Resilience Mode
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
          Kamu Sedang Offline
        </h1>

        <p className="text-sm text-stone-400 mb-6 leading-relaxed">
          Koneksi internet terputus, tetapi ruang kerja lokalmu tetap aktif.
          Semua perubahan tersimpan di perangkat via IndexedDB dan akan disinkronkan otomatis begitu kamu kembali online.
        </p>

        {/* Offline Features Pill */}
        <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-6 flex flex-col gap-2.5 text-left text-xs text-stone-300">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#FF2A4D] shrink-0" />
            <span>Akses penuh database offline (Dexie.js)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Append-only mutation queue siap di-flush ke Drive</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full py-3 px-5 rounded-xl bg-[#FF2A4D] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#e02040] transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            <span>{isChecking ? "Memeriksa Koneksi..." : "Coba Sambungkan Lagi"}</span>
          </button>

          <Link
            href="/workspace"
            className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 font-medium text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Workspace Lokal</span>
          </Link>
        </div>

        {isOnline && (
          <div className="mt-4 text-xs text-emerald-400 font-medium">
            Koneksi internet kembali! Klik &ldquo;Coba Sambungkan Lagi&rdquo; untuk refresh.
          </div>
        )}
      </div>
    </main>
  );
}
