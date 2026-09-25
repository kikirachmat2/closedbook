"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Download, Cloud, Share2, FileSpreadsheet, FileText, Check, AlertCircle } from "lucide-react";
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
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !!navigator.share) {
      setCanShare(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !document) {
      setPreviewRows([]);
      setDownloadSuccess(false);
      return;
    }

    startTransition(async () => {
      try {
        const rows = await parseDocumentPreview(document.metadata.templateType, document.buffer);
        setPreviewRows(rows);
      } catch (err) {
        console.error("Failed to parse document preview:", err);
        setPreviewRows([["Status", "Preview rendering failed. File is ready for download."]]);
      }
    });
  }, [isOpen, document]);

  const handleDownload = () => {
    if (!document) return;
    triggerHaptic("medium");

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
  };

  const handleShare = async () => {
    if (!document) return;
    triggerHaptic("light");

    try {
      const file = new File([document.buffer as unknown as BlobPart], document.filename, {
        type: document.mimeType,
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: document.metadata.title,
          text: `ClosedBook export: ${document.metadata.title}`,
        });
      } else {
        await navigator.share({
          title: document.metadata.title,
          text: `Generated ${document.metadata.title} (${document.filename})`,
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.warn("Share failed:", err);
      }
    }
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
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={document.metadata.title}
      initialSnap="half"
      triggerRef={triggerRef}
    >
      <div className="flex flex-col gap-4 text-[var(--cb-text-primary,#111827)] pb-6" data-testid="document-preview-sheet">
        {/* Metadata Header Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-[var(--cb-radius-surface,14px)] bg-[var(--cb-surface,#FFFFFF)] border border-[var(--cb-border,#E5E7EB)]">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--cb-surface-elevated,#F3F4F6)] text-[var(--cb-text-primary,#111827)] shrink-0">
            {isDocx ? <FileText className="w-6 h-6 text-blue-600" /> : <FileSpreadsheet className="w-6 h-6 text-emerald-600" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm truncate" data-testid="doc-preview-title">
              {document.metadata.title}
            </h4>
            <p className="text-xs text-[var(--cb-text-secondary,#4B5563)] truncate" data-testid="doc-preview-filename">
              {document.filename}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--cb-text-tertiary,#6B7280)]">
              <span>{sizeFormatted}</span>
              <span>•</span>
              <span>Updated {lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Preview Container: First 10 Rows Table */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide uppercase text-[var(--cb-text-secondary,#4B5563)]">
              Preview (First 10 Rows)
            </span>
            <span className="text-[11px] text-[var(--cb-text-tertiary,#6B7280)]">
              Client In-Memory Buffer
            </span>
          </div>

          <div
            className="w-full max-h-56 overflow-auto rounded-lg border border-[var(--cb-border,#E5E7EB)] bg-[var(--cb-surface,#FFFFFF)]"
            tabIndex={0}
            aria-label="Document table preview"
          >
            {isPending ? (
              <div className="flex items-center justify-center p-8 text-xs text-[var(--cb-text-secondary,#4B5563)]">
                Parsing document preview...
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
                        <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-[var(--cb-text-primary,#111827)]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center p-8 text-xs text-[var(--cb-text-secondary,#4B5563)]">
                No preview data available
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {/* Primary Action: Download */}
          <button
            type="button"
            onClick={handleDownload}
            data-testid="btn-download-doc"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-[var(--cb-radius-interactive,10px)] bg-[var(--cb-brand,#111827)] text-white font-medium text-sm transition-transform active:scale-[0.99] cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded Successfully</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download ({sizeFormatted})</span>
              </>
            )}
          </button>

          {/* Secondary Actions: Save to Drive (Disabled BLOCKER-001) & Share */}
          <div className="flex items-center gap-2">
            {/* Save to Drive — Disabled */}
            <div className="relative flex-1 group">
              <button
                type="button"
                disabled
                aria-disabled="true"
                data-testid="btn-save-drive"
                title="Login Google required (blocked by BLOCKER-001)"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-[var(--cb-radius-interactive,10px)] border border-[var(--cb-border,#E5E7EB)] bg-[var(--cb-surface-elevated,#F9FAFB)] text-[var(--cb-text-tertiary,#9CA3AF)] text-xs font-medium cursor-not-allowed opacity-75"
              >
                <Cloud className="w-4 h-4" />
                <span>Save to Drive</span>
              </button>
            </div>

            {/* Share via Web Share API */}
            {canShare && (
              <button
                type="button"
                onClick={handleShare}
                data-testid="btn-share-doc"
                className="flex items-center justify-center gap-2 px-4 h-11 rounded-[var(--cb-radius-interactive,10px)] border border-[var(--cb-border,#E5E7EB)] bg-[var(--cb-surface,#FFFFFF)] text-[var(--cb-text-primary,#111827)] text-xs font-medium transition-transform active:scale-[0.99] cursor-pointer hover:bg-[var(--cb-surface-elevated,#F9FAFB)]"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
          </div>

          {/* BLOCKER-001 Notice */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] border border-amber-200 dark:border-amber-900/50">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Google Drive sync currently disabled: Login Google required (BLOCKER-001). Direct download is fully active.</span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
