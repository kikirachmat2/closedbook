"use client";

import React, { useState } from "react";
import BottomSheet from "@/components/mobile/BottomSheet";
import { ListSort, usePreferences } from "@/lib/preferences";
import { Filter, RotateCcw, Check } from "lucide-react";

export interface FilterState {
  dateRange: "all" | "today" | "week" | "month";
  category: string;
  status: string;
  minAmount?: string;
  maxAmount?: string;
  sort: ListSort;
}

export const INITIAL_FILTER_STATE: FilterState = {
  dateRange: "all",
  category: "all",
  status: "all",
  minAmount: "",
  maxAmount: "",
  sort: "recent",
};

export interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (newFilters: FilterState) => void;
  categories?: { id: string; name: string }[];
  statuses?: { id: string; label: string }[];
}

export default function FilterSheet({
  isOpen,
  onClose,
  filters,
  onApply,
  categories = [],
  statuses = [
    { id: "all", label: "Semua Status" },
    { id: "approved", label: "Approved" },
    { id: "pending", label: "Pending" },
    { id: "rejected", label: "Rejected" },
  ],
}: FilterSheetProps) {
  const { listSort, setListSort } = usePreferences();
  const [draft, setDraft] = useState<FilterState>({ ...filters, sort: listSort });

  // Sync draft when opened
  React.useEffect(() => {
    if (isOpen) {
      setDraft({ ...filters, sort: listSort });
    }
  }, [isOpen, filters, listSort]);

  const handleReset = () => {
    setDraft({ ...INITIAL_FILTER_STATE, sort: "recent" });
  };

  const handleApply = () => {
    setListSort(draft.sort);
    onApply(draft);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter & Urutan">
      <div data-testid="filter-sheet-content" className="p-4 space-y-6">
        {/* Sort Section */}
        <div>
          <label className="text-xs uppercase tracking-wider font-mono text-[#a3a3a3] block mb-2.5">
            Urutan (Sort)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "recent", label: "Terbaru" },
              { id: "amount_desc", label: "Nominal Tertinggi" },
              { id: "alphabetical", label: "A-Z" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                data-testid={`sort-btn-${option.id}`}
                onClick={() => setDraft((d) => ({ ...d, sort: option.id as ListSort }))}
                className={`min-h-[44px] px-2 py-2 text-xs font-medium rounded-xl border text-center transition-all ${
                  draft.sort === option.id
                    ? "bg-[var(--color-primary,#ff1e42)]/15 border-[var(--color-primary,#ff1e42)] text-[var(--color-primary,#ff1e42)]"
                    : "bg-[#181818] border-white/[0.08] text-[#a3a3a3] hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-xs uppercase tracking-wider font-mono text-[#a3a3a3] block mb-2.5">
            Rentang Waktu
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "all", label: "Semua" },
              { id: "today", label: "Hari Ini" },
              { id: "week", label: "Minggu Ini" },
              { id: "month", label: "Bulan Ini" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                data-testid={`date-filter-btn-${option.id}`}
                onClick={() => setDraft((d) => ({ ...d, dateRange: option.id as any }))}
                className={`min-h-[44px] px-2 py-2 text-xs font-medium rounded-xl border text-center transition-all ${
                  draft.dateRange === option.id
                    ? "bg-[var(--color-primary,#ff1e42)]/15 border-[var(--color-primary,#ff1e42)] text-[var(--color-primary,#ff1e42)]"
                    : "bg-[#181818] border-white/[0.08] text-[#a3a3a3] hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        {statuses.length > 0 && (
          <div>
            <label className="text-xs uppercase tracking-wider font-mono text-[#a3a3a3] block mb-2.5">
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statuses.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  data-testid={`status-filter-btn-${st.id}`}
                  onClick={() => setDraft((d) => ({ ...d, status: st.id }))}
                  className={`min-h-[44px] px-3 py-2 text-xs font-medium rounded-xl border text-center transition-all ${
                    draft.status === st.id
                      ? "bg-[var(--color-primary,#ff1e42)]/15 border-[var(--color-primary,#ff1e42)] text-[var(--color-primary,#ff1e42)]"
                      : "bg-[#181818] border-white/[0.08] text-[#a3a3a3] hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories / Departments */}
        {categories.length > 0 && (
          <div>
            <label className="text-xs uppercase tracking-wider font-mono text-[#a3a3a3] block mb-2.5">
              Kategori / Departemen
            </label>
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              data-testid="filter-category-select"
              className="w-full bg-[#181818] border border-white/[0.08] rounded-xl px-4 min-h-[48px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons: Reset & Apply */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            data-testid="btn-reset-filters"
            onClick={handleReset}
            className="flex-1 min-h-[48px] px-4 rounded-xl border border-white/[0.08] bg-[#141414] hover:bg-white/[0.05] text-[#a3a3a3] hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            data-testid="btn-apply-filters"
            onClick={handleApply}
            className="flex-1 min-h-[48px] px-4 rounded-xl bg-[var(--color-primary,#ff1e42)] hover:bg-[var(--color-primary-hover,#e01a3a)] text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
