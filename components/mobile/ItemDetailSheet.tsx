"use client";

import React, { useState } from "react";
import BottomSheet from "@/components/mobile/BottomSheet";
import {
  Edit3,
  Trash2,
  Share2,
  Copy,
  Clock,
  Link as LinkIcon,
  ArrowLeft,
  Calendar,
  Tag,
  DollarSign,
  User,
} from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";

export interface ItemMetadata {
  label: string;
  value: string | number;
}

export interface ItemHistoryEntry {
  action: string;
  user: string;
  timestamp: string;
}

export interface RelatedItem {
  id: string;
  title: string;
  type: string;
}

export interface DetailItemData {
  id: string;
  title: string;
  subtitle?: string;
  amount?: string;
  status?: string;
  category?: string;
  assignee?: string;
  date?: string;
  metadata?: ItemMetadata[];
  relatedItems?: RelatedItem[];
  history?: ItemHistoryEntry[];
}

export interface ItemDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: DetailItemData | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  isStackedEditOpen?: boolean;
  onCloseStackedEdit?: () => void;
  renderStackedContent?: () => React.ReactNode;
}

export default function ItemDetailSheet({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
  onShare,
  onDuplicate,
  isStackedEditOpen = false,
  onCloseStackedEdit,
  renderStackedContent,
}: ItemDetailSheetProps) {
  const { triggerHaptic } = useHaptic();

  if (!item) return null;

  return (
    <>
      <BottomSheet
        isOpen={isOpen && !isStackedEditOpen}
        onClose={onClose}
        title={item.title}
      >
        <div data-testid="item-detail-sheet-content" className="p-4 space-y-6">
          {/* Header Summary */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <h2 className="text-base font-semibold text-[#fdfdfd]">{item.title}</h2>
              {item.subtitle && (
                <p className="text-xs text-[#a3a3a3] mt-0.5">{item.subtitle}</p>
              )}
              {item.category && (
                <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-[#737373]">
                  {item.category}
                </span>
              )}
            </div>

            {item.amount && (
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-white block">
                  {item.amount}
                </span>
                {item.status && (
                  <span
                    className={`inline-block mt-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                      item.status === "approved" || item.status === "done"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : item.status === "pending" || item.status === "in_progress"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    {item.status}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-4 gap-2">
            {onEdit && (
              <button
                type="button"
                data-testid="detail-action-edit"
                onClick={() => {
                  triggerHaptic("light");
                  onEdit();
                }}
                className="min-h-[44px] p-2 flex flex-col items-center justify-center gap-1 rounded-xl bg-[#181818] border border-white/[0.08] hover:bg-white/10 text-xs font-medium text-white transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-[#a3a3a3]" />
                <span className="text-[11px]">Edit</span>
              </button>
            )}

            {onDuplicate && (
              <button
                type="button"
                data-testid="detail-action-duplicate"
                onClick={() => {
                  triggerHaptic("light");
                  onDuplicate();
                }}
                className="min-h-[44px] p-2 flex flex-col items-center justify-center gap-1 rounded-xl bg-[#181818] border border-white/[0.08] hover:bg-white/10 text-xs font-medium text-white transition-all active:scale-95"
              >
                <Copy className="w-4 h-4 text-[#a3a3a3]" />
                <span className="text-[11px]">Duplikat</span>
              </button>
            )}

            {onShare && (
              <button
                type="button"
                data-testid="detail-action-share"
                onClick={() => {
                  triggerHaptic("light");
                  onShare();
                }}
                className="min-h-[44px] p-2 flex flex-col items-center justify-center gap-1 rounded-xl bg-[#181818] border border-white/[0.08] hover:bg-white/10 text-xs font-medium text-white transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4 text-[#a3a3a3]" />
                <span className="text-[11px]">Bagikan</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                data-testid="detail-action-delete"
                onClick={() => {
                  triggerHaptic("medium");
                  onDelete();
                }}
                className="min-h-[44px] p-2 flex flex-col items-center justify-center gap-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="text-[11px]">Hapus</span>
              </button>
            )}
          </div>

          {/* Full Metadata Fields */}
          {item.metadata && item.metadata.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-mono text-[#737373] mb-2.5">
                Informasi Lengkap
              </h3>
              <div className="space-y-2 divide-y divide-white/[0.04]">
                {item.metadata.map((meta, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs">
                    <span className="text-[#a3a3a3]">{meta.label}</span>
                    <span className="text-white font-medium text-right font-mono">
                      {meta.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Items */}
          {item.relatedItems && item.relatedItems.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-mono text-[#737373] mb-2.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Item Terkait</span>
              </h3>
              <div className="space-y-2">
                {item.relatedItems.map((rel) => (
                  <div
                    key={rel.id}
                    data-testid={`related-item-${rel.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs"
                  >
                    <span className="text-white font-medium">{rel.title}</span>
                    <span className="text-[10px] font-mono text-[#737373] uppercase">
                      {rel.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History / Activity Log */}
          {item.history && item.history.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-mono text-[#737373] mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Riwayat Aktivitas</span>
              </h3>
              <div className="space-y-2.5 border-l-2 border-white/[0.08] ml-2 pl-3 py-1">
                {item.history.map((h, i) => (
                  <div key={i} className="text-xs">
                    <div className="text-white font-medium">{h.action}</div>
                    <div className="text-[11px] text-[#737373] mt-0.5">
                      oleh {h.user} • {h.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Stacked Sheet (Slide-in over detail for Edit flow) */}
      {isStackedEditOpen && (
        <BottomSheet
          isOpen={isStackedEditOpen}
          onClose={onCloseStackedEdit || onClose}
          title={`Edit: ${item.title}`}
        >
          <div data-testid="stacked-edit-sheet-content" className="p-4 space-y-4">
            <button
              type="button"
              data-testid="btn-back-to-detail"
              onClick={onCloseStackedEdit}
              className="flex items-center gap-1.5 text-xs text-[var(--color-primary,#ff1e42)] hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Detail</span>
            </button>
            {renderStackedContent ? (
              renderStackedContent()
            ) : (
              <div className="p-6 text-center text-xs text-[#a3a3a3]">
                Formulir edit siap diintegrasikan.
              </div>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  );
}
