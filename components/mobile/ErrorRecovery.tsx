"use client";

import React from "react";
import {
  WifiOff,
  AlertTriangle,
  Lock,
  RefreshCw,
  Download,
  AlertCircle,
} from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";

/**
 * 1. Network Error Banner (Inline Banner)
 * Acknowledges offline state while reassuring zero data loss:
 * "Offline. Perubahan akan disinkronkan otomatis ke Drive saat tersambung kembali."
 */
export function NetworkErrorBanner({
  onRetry,
  className = "",
}: {
  onRetry?: () => void;
  className?: string;
}) {
  const { triggerHaptic } = useHaptic();

  return (
    <div
      data-testid="network-error-banner"
      role="status"
      aria-live="polite"
      className={`p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
        <span>
          <strong>Offline.</strong> Perubahan tersimpan lokal dan akan disinkronkan otomatis.
        </span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            onRetry();
          }}
          className="shrink-0 min-h-[36px] px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium transition-colors"
        >
          Cek Koneksi
        </button>
      )}
    </div>
  );
}

/**
 * 2. Validation Error Helper (Inline Field)
 * Replaces vague error messages with specific action helper text and red border.
 */
export function ValidationErrorHelper({
  error,
  id,
}: {
  error?: string | null;
  id?: string;
}) {
  if (!error) return null;

  return (
    <div
      id={id}
      data-testid="validation-error-helper"
      role="alert"
      className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400 animate-in fade-in duration-150"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{error}</span>
    </div>
  );
}

/**
 * 3. Auth Session Error Modal
 * Smooth recovery: "Sesi verifikasi berakhir. Tap untuk login ulang tanpa kehilangan data."
 */
export function AuthErrorModal({
  isOpen,
  onReauth,
  onClose,
}: {
  isOpen: boolean;
  onReauth: () => void;
  onClose: () => void;
}) {
  const { triggerHaptic } = useHaptic();
  if (!isOpen) return null;

  return (
    <div
      data-testid="auth-error-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="surface-card w-full max-w-sm p-6 rounded-[22px] border border-white/[0.1] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[var(--color-paper,#fdfdfd)]">
            Sesi Berakhir
          </h3>
          <p className="text-xs text-[var(--color-stone,#737373)] leading-relaxed mt-1">
            Autentikasi Google Vault kedaluwarsa. Data lokal Anda tetap aman di IndexedDB.
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="flex-1 min-h-[44px] rounded-xl border border-white/[0.1] text-xs text-[var(--color-stone,#737373)] hover:text-white transition-colors"
          >
            Nanti
          </button>
          <button
            type="button"
            id="auth-relogin-btn"
            onClick={() => {
              triggerHaptic("medium");
              onReauth();
            }}
            className="flex-1 min-h-[44px] rounded-xl bg-[var(--color-primary,#ff1e42)] text-white text-xs font-medium hover:brightness-110 shadow-lg shadow-[var(--color-primary,#ff1e42)]/20 transition-all"
          >
            Login Ulang
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Critical Error Full-Screen Fallback
 * Peak-End Rule: Never leave user in a dead end. Always provide Recovery + Emergency Export.
 */
export function CriticalErrorFallback({
  error,
  onReset,
  onDownloadBackup,
}: {
  error?: Error | string | null;
  onReset?: () => void;
  onDownloadBackup?: () => void;
}) {
  const { triggerHaptic } = useHaptic();

  return (
    <div
      data-testid="critical-error-fallback"
      role="alert"
      className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-6 shadow-xl">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1 className="font-serif text-[28px] font-normal tracking-tight text-[var(--color-paper,#fdfdfd)] mb-2">
        Gagal Menyimpan Sesi
      </h1>

      <p className="text-sm text-[var(--color-pearl,#d4d4d4)] max-w-sm mb-6 leading-relaxed">
        Terjadi kendala sistem, namun data transaksi Anda tetap tersimpan aman di database lokal browser.
      </p>

      {error && (
        <pre className="p-3 mb-6 rounded-xl bg-black/50 border border-white/[0.08] text-[11px] font-mono text-rose-300 max-w-md overflow-x-auto text-left w-full">
          {typeof error === "string" ? error : error.message}
        </pre>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        {onReset && (
          <button
            type="button"
            id="critical-retry-btn"
            onClick={() => {
              triggerHaptic("medium");
              onReset();
            }}
            className="w-full min-h-[48px] rounded-full bg-[var(--color-primary,#ff1e42)] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary,#ff1e42)]/25 hover:brightness-110 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
        )}

        {onDownloadBackup && (
          <button
            type="button"
            id="critical-backup-btn"
            onClick={() => {
              triggerHaptic("light");
              onDownloadBackup();
            }}
            className="w-full min-h-[48px] rounded-full border border-white/[0.15] text-[var(--color-paper,#fdfdfd)] font-medium text-xs flex items-center justify-center gap-2 hover:border-white/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan</span>
          </button>
        )}
      </div>
    </div>
  );
}
