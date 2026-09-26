"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Download,
  Cloud,
  Share2,
  FileSpreadsheet,
  FileText,
  Check,
  Info,
  ExternalLink,
  X,
  AlertCircle,
} from "lucide-react";
import BottomSheet from "./BottomSheet";
import type { GeneratedDocument } from "@/lib/documents/types";
import { parseDocumentPreview } from "@/lib/documents";
import { useHaptic } from "@/lib/hooks/use-haptic";

export interface DocumentPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument | null;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export default function DocumentPreviewSheet({
  isOpen,
  onClose,
  document,
  triggerRef,
}: DocumentPreviewSheetProps) {
  const { triggerHaptic } = useHaptic();
  const [isPending, startTransition] = useTransition();
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareFallbackNotice, setShareFallbackNotice] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    if (!isOpen || !document) {
      setPreviewRows([]);
      setDownloadSuccess(false);
      setShareFallbackNotice(null);
      setIsDriveModalOpen(false);
      setParseError(false);
      return;
    }

    startTransition(async () => {
      try {
        setParseError(false);
        const rows = await parseDocumentPreview(document.metadata.templateType, document.buffer);
        setPreviewRows(rows);
      } catch (err) {
        console.warn("Pratinjau dokumen tidak dapat diparse:", err);
        setParseError(true);
        setPreviewRows([]);
      }
    });
  }, [isOpen, document]);

  const handleDownload = () => {
    if (!document) return;
    triggerHaptic("medium");

    try {
      const blob = new Blob([document.buffer as unknown as BlobPart], { type: document.mimeType });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error("Gagal mengunduh file:", err);
      setShareFallbackNotice("Gagal mengunduh otomatis. Periksa izin unduhan browser Anda.");
    }
  };

  const handleShare = async () => {
    if (!document) return;
    triggerHaptic("light");

    const canUseShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    if (canUseShare) {
      try {
        const file = new File([document.buffer as unknown as BlobPart], document.filename, {
          type: document.mimeType,
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: document.metadata.title,
            text: `ClosedBook Dokumen: ${document.metadata.title}`,
          });
          return;
        } else {
          await navigator.share({
            title: document.metadata.title,
            text: `Dokumen produksi: ${document.metadata.title} (${document.filename})`,
          });
          return;
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.warn("Web Share API gagal, beralih ke fallback unduh:", err);
      }
    }

    // Fallback untuk Firefox / Desktop / Browser tanpa Share API
    handleDownload();
    setShareFallbackNotice("File diunduh ke perangkat Anda. Silakan bagikan secara manual.");
    setTimeout(() => setShareFallbackNotice(null), 4000);
  };

  if (!document) return null;

  const isDocx = document.metadata.templateType === "call-sheet";
  const sizeFormatted = (document.metadata.estimatedSizeBytes / 1024).toFixed(1) + " KB";
  const lastUpdated = new Date(document.metadata.lastUpdated).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={document.metadata.title}
        initialSnap="half"
        triggerRef={triggerRef}
      >
        <div
          className="flex flex-col gap-4 text-[var(--cb-text-primary,#111827)] pb-6"
          data-testid="document-preview-sheet"
        >
          {/* Kartu Metadata Header */}
          <div className="flex items-center gap-3 p-3.5 rounded-[var(--cb-radius-surface,14px)] bg-[var(--cb-surface,#FFFFFF)] border border-[var(--cb-border,#E5E7EB)]">
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--cb-surface-elevated,#F3F4F6)] text-[var(--cb-text-primary,#111827)] shrink-0">
              {isDocx ? (
                <FileText className="w-6 h-6 text-blue-600" />
              ) : (
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm truncate" data-testid="doc-preview-title">
                {document.metadata.title}
              </h4>
              <p
                className="text-xs text-[var(--cb-text-secondary,#4B5563)] truncate"
                data-testid="doc-preview-filename"
              >
                {document.filename}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--cb-text-secondary,#9CA3AF)]">
                <span>{sizeFormatted}</span>
                <span>•</span>
                <span>Diperbarui {lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Fallback Notice jika Share / Unduh manual aktif */}
          {shareFallbackNotice && (
            <div
              data-testid="share-fallback-notice"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800"
            >
              <Info className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{shareFallbackNotice}</span>
            </div>
          )}

          {/* Kontainer Pratinjau Tabel */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide uppercase text-[var(--cb-text-secondary,#9CA3AF)]">
                Pratinjau (10 Baris Pertama)
              </span>
              <span className="text-[11px] text-[var(--cb-text-secondary,#9CA3AF)]">
                Buffer Memori Lokal (Zero-Retention)
              </span>
            </div>

            <div
              className="w-full max-h-56 overflow-auto rounded-lg border border-[var(--cb-border,#E5E7EB)] bg-[var(--cb-surface,#FFFFFF)]"
              tabIndex={0}
              aria-label="Document table preview"
            >
              {isPending ? (
                <div className="flex items-center justify-center p-8 text-xs text-[var(--cb-text-secondary,#4B5563)]">
                  Memuat pratinjau dokumen...
                </div>
              ) : parseError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-[var(--cb-text-secondary,#4B5563)] gap-1">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <p className="font-medium">Pratinjau tabel tidak dapat ditampilkan untuk format ini.</p>
                  <p className="text-[11px] text-[var(--cb-text-tertiary,#6B7280)]">
                    File dokumen biner Anda tetap valid dan dapat langsung diunduh utuh.
                  </p>
                </div>
              ) : previewRows.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <tbody>
                    {previewRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={
                          rIdx === 0
                            ? "bg-[var(--cb-surface-elevated,#F9FAFB)] font-semibold border-b border-[var(--cb-border,#E5E7EB)]"
                            : "border-b border-[var(--cb-border,#F3F4F6)] last:border-b-0 hover:bg-[var(--cb-surface-elevated,#F9FAFB)]/50"
                        }
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3 py-2 whitespace-nowrap text-[var(--cb-text-primary,#111827)]"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center p-8 text-xs text-[var(--cb-text-secondary,#4B5563)]">
                  Tidak ada data pratinjau
                </div>
              )}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col gap-2.5 pt-2">
            {/* Aksi Utama: Unduh */}
            <button
              type="button"
              onClick={handleDownload}
              data-testid="btn-download-doc"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-[var(--cb-radius-interactive,10px)] bg-[var(--cb-brand,#111827)] text-white font-medium text-sm transition-transform active:scale-[0.99] cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Berhasil Diunduh</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh ({sizeFormatted})</span>
                </>
              )}
            </button>

            {/* Aksi Sekunder: Simpan ke Drive (Aktif Onboarding) & Bagikan */}
            <div className="flex items-center gap-2">
              {/* Simpan ke Drive — ENABLED (Pemberdayaan Onboarding, Tanpa Anti-Pattern) */}
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(true)}
                data-testid="btn-save-drive"
                className="flex items-center justify-center gap-2 flex-1 h-11 rounded-[var(--cb-radius-interactive,10px)] border border-[var(--color-primary,#ff1e42)]/30 bg-[var(--color-primary,#ff1e42)]/[0.08] text-[var(--color-primary,#ff1e42)] hover:bg-[var(--color-primary,#ff1e42)]/[0.12] text-xs font-semibold transition-transform active:scale-[0.99] cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>Simpan ke Drive</span>
              </button>

              {/* Bagikan via Web Share API atau Fallback */}
              <button
                type="button"
                onClick={handleShare}
                data-testid="btn-share-doc"
                className="flex items-center justify-center gap-2 px-5 h-11 rounded-[var(--cb-radius-interactive,10px)] border border-[var(--cb-border,#E5E7EB)] bg-[var(--cb-surface,#FFFFFF)] text-[var(--cb-text-primary,#111827)] text-xs font-medium transition-transform active:scale-[0.99] cursor-pointer hover:bg-[var(--cb-surface-elevated,#F9FAFB)]"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan</span>
              </button>
            </div>

            {/* Catatan Privasi & Keamanan Lokal */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[var(--cb-surface-elevated,#F9FAFB)] text-[var(--cb-text-secondary,#4B5563)] text-[11px] border border-[var(--cb-border,#E5E7EB)]">
              <Info className="w-3.5 h-3.5 shrink-0 text-[var(--cb-text-tertiary,#6B7280)]" />
              <span>Dokumen biner dikompilasi langsung di browser tanpa transit server (Zero-Retention).</span>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Onboarding Dialog: Hubungkan Google Drive */}
      {isDriveModalOpen && (
        <div
          data-testid="drive-onboarding-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drive-onboarding-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="surface-panel w-full max-w-sm rounded-[18px] p-5 border border-white/[0.12] bg-[#111111] text-[#fdfdfd] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsDriveModalOpen(false)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded-full"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary,#ff1e42)]/15 border border-[var(--color-primary,#ff1e42)]/30 text-[var(--color-primary,#ff1e42)] mb-3">
              <Cloud className="w-6 h-6" />
            </div>

            <h3 id="drive-onboarding-title" className="text-base font-semibold text-white mb-2">
              Hubungkan Google Drive
            </h3>

            <p className="text-xs text-[#a3a3a3] leading-relaxed mb-5">
              Hubungkan akun Google Drive untuk menyimpan dokumen produksi langsung ke folder tim Anda.
              Dokumen Anda tetap tersimpan aman di perangkat lokal selama belum terhubung.
            </p>

            <div className="flex flex-col gap-2">
              <a
                href="/api/auth/google/login"
                data-testid="btn-connect-google-drive"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-[var(--cb-radius-interactive,10px)] bg-[var(--color-primary,#ff1e42)] text-white font-medium text-xs transition-transform active:scale-[0.99]"
              >
                <span>Hubungkan Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                data-testid="btn-dismiss-drive-modal"
                className="w-full h-10 rounded-[var(--cb-radius-interactive,10px)] text-xs text-[#888888] hover:text-white font-medium transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
