"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { FilterState, INITIAL_FILTER_STATE } from "./FilterSheet";

export interface SearchBarProps {
  id?: string;
  query: string;
  onQueryChange: (query: string) => void;
  filters?: FilterState;
  onOpenFilter?: () => void;
  onResetFilters?: () => void;
  placeholder?: string;
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

export default function SearchBar({
  id = "mobile-search-bar",
  query,
  onQueryChange,
  filters,
  onOpenFilter,
  onResetFilters,
  placeholder = "Cari transaksi, deskripsi, vendor...",
  className = "",
  isExpanded: controlledExpanded,
  onToggleExpand,
}: SearchBarProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedInput, setDebouncedInput] = useState(query);

  // Sync external query
  useEffect(() => {
    setDebouncedInput(query);
  }, [query]);

  // Debounce 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      onQueryChange(debouncedInput);
    }, 200);

    return () => clearTimeout(handler);
  }, [debouncedInput, onQueryChange]);

  const setExpanded = (exp: boolean) => {
    if (onToggleExpand) {
      onToggleExpand(exp);
    } else {
      setInternalExpanded(exp);
    }
    if (exp) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Count active non-default filters
  const activeFilterCount = filters
    ? (filters.dateRange !== "all" ? 1 : 0) +
      (filters.category !== "all" ? 1 : 0) +
      (filters.status !== "all" ? 1 : 0) +
      (filters.minAmount || filters.maxAmount ? 1 : 0) +
      (filters.sort !== "recent" ? 1 : 0)
    : 0;

  return (
    <div id={id} data-testid="search-bar-container" className={`w-full space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Search Input Container */}
        <div
          className={`relative flex items-center flex-1 bg-[#121212] border border-white/[0.08] focus-within:border-[var(--color-primary,#ff1e42)] rounded-full transition-all min-h-[44px] px-3.5 ${
            isExpanded ? "w-full" : "w-auto"
          }`}
        >
          <Search className="w-4 h-4 text-[#737373] shrink-0 mr-2" />
          <input
            ref={inputRef}
            type="text"
            data-testid="search-input"
            value={debouncedInput}
            onChange={(e) => setDebouncedInput(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs text-[#fdfdfd] placeholder-[#737373] focus:outline-none"
          />
          {debouncedInput && (
            <button
              type="button"
              data-testid="search-clear-btn"
              onClick={() => {
                setDebouncedInput("");
                onQueryChange("");
              }}
              className="p-1 rounded-full text-[#737373] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        {onOpenFilter && (
          <button
            type="button"
            data-testid="btn-open-filter-sheet"
            onClick={onOpenFilter}
            className={`min-h-[44px] min-w-[44px] px-3 flex items-center justify-center gap-1.5 rounded-full border text-xs font-medium transition-all ${
              activeFilterCount > 0
                ? "bg-[var(--color-primary,#ff1e42)]/15 border-[var(--color-primary,#ff1e42)] text-[var(--color-primary,#ff1e42)]"
                : "bg-[#121212] border-white/[0.08] text-[#a3a3a3] hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span
                data-testid="active-filter-badge"
                className="w-4 h-4 rounded-full bg-[var(--color-primary,#ff1e42)] text-white text-[10px] flex items-center justify-center font-bold"
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && filters && (
        <div data-testid="active-filter-chips" className="flex items-center gap-1.5 flex-wrap pt-1">
          {filters.dateRange !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#fdfdfd]">
              <span>Waktu: {filters.dateRange}</span>
            </span>
          )}
          {filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#fdfdfd]">
              <span>Status: {filters.status}</span>
            </span>
          )}
          {filters.category !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#fdfdfd]">
              <span>Kategori: {filters.category}</span>
            </span>
          )}
          {filters.sort !== "recent" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#fdfdfd]">
              <span>Urutan: {filters.sort}</span>
            </span>
          )}
          {onResetFilters && (
            <button
              type="button"
              data-testid="btn-clear-active-filters"
              onClick={onResetFilters}
              className="text-[10px] text-[var(--color-primary,#ff1e42)] hover:underline ml-1"
            >
              Reset Semua
            </button>
          )}
        </div>
      )}
    </div>
  );
}
