"use client";

import React, { useState } from "react";
import { Trash2, Archive, FileDown, AlertTriangle } from "lucide-react";
import BottomSheet from "@/components/mobile/BottomSheet";
import { useHaptic } from "@/lib/hooks/use-haptic";

export interface BulkActionBarProps {
  selectedCount: number;
  onBulkDelete: () => Promise<void> | void;
  onBulkArchive?: () => Promise<void> | void;
  onBulkExport?: () => Promise<void> | void;
  isProcessing?: boolean;
  progress?: number; // 0 to 100 for > 10 items
  className?: string;
}

export default function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onBulkArchive,
  onBulkExport,
  isProcessing = false,
  progress,
  className = "",
}: BulkActionBarProps) {
  const { triggerHaptic } = useHaptic();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (selectedCount === 0) return null;

  const handleDeleteClick = () => {
    triggerHaptic("medium");
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmOpen(false);
    triggerHaptic("heavy");
    await onBulkDelete();
  };

  return (
    <>
      <div
        data-testid="bulk-action-bar"
        className={`fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto transition-transform ${className}`}
      >
        {/* Progress bar if > 10 items */}
        {selectedCount > 10 && typeof progress === "number" && (
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden mb-2.5">
            <div
              data-testid="bulk-progress-bar"
              className="bg-[var(--color-primary,#ff1e42)] h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[#a3a3a3] font-medium">
            <span data-testid="bulk-selected-count" className="text-white font-semibold">
              {selectedCount}
            </span>{" "}
            item dipilih
          </div>

          <div className="flex items-center gap-2">
            {onBulkExport && (
              <button
                type="button"
                data-testid="btn-bulk-export"
                onClick={() => {
                  triggerHaptic("light");
                  onBulkExport();
                }}
                disabled={isProcessing}
                className="min-h-[40px] px-3 rounded-xl bg-[#181818] border border-white/[0.08] hover:bg-white/10 text-xs font-medium text-white flex items-center gap-1.5 transition-all active:scale-95"
                title="Export Selected"
              >
                <FileDown className="w-4 h-4 text-[#a3a3a3]" />
                <span className="hidden sm:inline">Ekspor</span>
              </button>
            )}

            {onBulkArchive && (
              <button
                type="button"
                data-testid="btn-bulk-archive"
                onClick={() => {
                  triggerHaptic("light");
                  onBulkArchive();
                }}
                disabled={isProcessing}
                className="min-h-[40px] px-3 rounded-xl bg-[#181818] border border-white/[0.08] hover:bg-white/10 text-xs font-medium text-white flex items-center gap-1.5 transition-all active:scale-95"
                title="Archive Selected"
              >
                <Archive className="w-4 h-4 text-[#a3a3a3]" />
                <span className="hidden sm:inline">Arsipkan</span>
              </button>
            )}

            <button
              type="button"
              data-testid="btn-bulk-delete"
              onClick={handleDeleteClick}
              disabled={isProcessing}
              className="min-h-[40px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-medium text-white flex items-center gap-1.5 transition-all active:scale-95"
              title="Delete Selected"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation BottomSheet for Destructive Bulk Action */}
      <BottomSheet
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Konfirmasi Hapus Massal"
      >
        <div data-testid="bulk-delete-confirm-sheet" className="p-4 space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">Hapus {selectedCount} item sekaligus?</p>
              <p className="text-[#a3a3a3] mt-0.5">
                Tindakan ini dapat dibatalkan dalam waktu 5 detik via tombol Batal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              data-testid="btn-cancel-bulk-delete"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 min-h-[48px] px-4 rounded-xl bg-[#181818] border border-white/[0.08] text-xs font-medium text-[#a3a3a3] hover:text-white"
            >
              Batal
            </button>
            <button
              type="button"
              data-testid="btn-confirm-bulk-delete"
              onClick={handleConfirmDelete}
              className="flex-1 min-h-[48px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-medium text-white font-semibold"
            >
              Ya, Hapus Semua
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
