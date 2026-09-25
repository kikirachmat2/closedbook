"use client";

import React from "react";
import { Receipt, CheckSquare, Search, FilterX, Plus, RotateCcw } from "lucide-react";
import EmptyState from "@/components/mobile/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { usePreferences, ListDensity } from "@/lib/preferences";

/**
 * 1. Ledger Empty State
 * "Belum ada transaksi. Tap + untuk catat."
 */
export function LedgerEmptyState({
  onLogExpense,
}: {
  onLogExpense?: () => void;
}) {
  return (
    <EmptyState
      icon={Receipt}
      headline="Belum ada transaksi"
      body="Belum ada transaksi. Tap + untuk catat."
      actionLabel="Catat Pengeluaran"
      actionId="btn-empty-log-expense"
      onAction={onLogExpense}
    />
  );
}

/**
 * 2. Ledger Loading State (5 rows matching card density)
 */
export function LedgerLoadingSkeleton({
  count = 5,
}: {
  count?: number;
}) {
  const { listDensity } = usePreferences();
  const heightClass =
    listDensity === "compact"
      ? "h-[56px]"
      : listDensity === "spacious"
      ? "h-[88px]"
      : "h-[72px]";

  return (
    <div data-testid="ledger-loading-skeleton" className="space-y-2 w-full animate-fade-in">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`w-full ${heightClass} rounded-[var(--cb-radius-surface,14px)] border border-white/[0.06] bg-[#121212] p-4 flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-2 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 3. Tasks Empty State
 * "Semua beres! 🎬"
 */
export function TasksEmptyState({
  onNewTask,
}: {
  onNewTask?: () => void;
}) {
  return (
    <EmptyState
      icon={CheckSquare}
      headline="Semua beres! 🎬"
      body="Semua tugas produksi telah selesai atau belum ada tugas aktif."
      actionLabel="Buat Tugas Baru"
      actionId="btn-empty-new-task"
      onAction={onNewTask}
    />
  );
}

/**
 * 4. Search No Result State
 * "Tidak ditemukan '{query}'. Coba kata kunci lain."
 */
export function SearchNoResultState({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      headline="Hasil Tidak Ditemukan"
      body={`Tidak ditemukan '${query}'. Coba kata kunci lain.`}
      actionLabel={onClear ? "Hapus Pencarian" : undefined}
      actionId="btn-clear-search-query"
      onAction={onClear}
    />
  );
}

/**
 * 5. Filter No Result State
 * "Tidak ada yang cocok dengan filter. [Reset Filter]"
 */
export function FilterNoResultState({
  onReset,
}: {
  onReset?: () => void;
}) {
  return (
    <EmptyState
      icon={FilterX}
      headline="Filter Tidak Cocok"
      body="Tidak ada yang cocok dengan filter."
      actionLabel="Reset Filter"
      actionId="btn-reset-filter-state"
      onAction={onReset}
    />
  );
}
