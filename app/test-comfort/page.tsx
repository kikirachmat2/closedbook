"use client";

import React, { useState, useRef, useMemo } from "react";
import { usePreferences, ListDensity, ListSort } from "@/lib/preferences";
import ListItemCard from "@/components/mobile/ListItemCard";
import SwipeableCard from "@/components/mobile/SwipeableCard";
import VirtualCardList from "@/components/mobile/VirtualCardList";
import SectionHeader from "@/components/mobile/SectionHeader";
import SearchBar from "@/components/mobile/SearchBar";
import FilterSheet, { FilterState, INITIAL_FILTER_STATE } from "@/components/mobile/FilterSheet";
import HighlightText from "@/components/mobile/HighlightText";
import TopAppBar from "@/components/mobile/TopAppBar";
import BulkActionBar from "@/components/mobile/BulkActionBar";
import ItemDetailSheet, { DetailItemData } from "@/components/mobile/ItemDetailSheet";
import {
  LedgerEmptyState,
  LedgerLoadingSkeleton,
  TasksEmptyState,
  SearchNoResultState,
  FilterNoResultState,
} from "@/components/mobile/ListStatePresets";
import { useUndoableAction } from "@/lib/hooks/use-undoable-action";
import { groupItemsByTime } from "@/lib/utils/time-grouping";
import { Receipt, Check, Trash2, Sliders } from "lucide-react";

interface ComfortItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountVal: number;
  category: string;
  status: "approved" | "pending" | "rejected";
  date: string;
  variant?: "default" | "compact" | "urgent" | "selected" | "disabled";
}

const INITIAL_ITEMS: ComfortItem[] = [
  {
    id: "tx-today-1",
    title: "Sewa Genset 5000W Honda",
    subtitle: "Vendor Sumber Listrik Abadi",
    amount: "$250.00",
    amountVal: 250,
    category: "Equipment",
    status: "approved",
    date: new Date().toISOString(),
  },
  {
    id: "tx-today-2",
    title: "Konsumsi Kru Shooting Day 1",
    subtitle: "Katering Bu Darto (35 pax)",
    amount: "$175.00",
    amountVal: 175,
    category: "Catering",
    status: "pending",
    date: new Date().toISOString(),
    variant: "urgent",
  },
  {
    id: "tx-yesterday-1",
    title: "Bahan Bakar Genset & Truk",
    subtitle: "SPBU TB Simatupang",
    amount: "$85.00",
    amountVal: 85,
    category: "Transportation",
    status: "approved",
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tx-week-1",
    title: "Lensa Sony FE 24-70mm GM II",
    subtitle: "Focus Nusantara Rental",
    amount: "$420.00",
    amountVal: 420,
    category: "Camera",
    status: "approved",
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tx-older-1",
    title: "Izin Lokasi Kota Tua",
    subtitle: "Dinas Pariwisata & Kebudayaan",
    amount: "$600.00",
    amountVal: 600,
    category: "Permits",
    status: "approved",
    date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

// Generate 500 items for virtual scroll testing
const FIVE_HUNDRED_ITEMS: ComfortItem[] = Array.from({ length: 500 }, (_, i) => ({
  id: `v-tx-${i + 1}`,
  title: i === 12 ? "Sewa Genset Portable 3000W" : `Transaksi Produksi #${i + 1}`,
  subtitle: `Vendor Rekanan #${(i % 15) + 1}`,
  amount: `$${((i * 17) % 800 + 50).toFixed(2)}`,
  amountVal: (i * 17) % 800 + 50,
  category: i % 3 === 0 ? "Camera" : i % 3 === 1 ? "Equipment" : "Catering",
  status: i % 4 === 0 ? "pending" : "approved",
  date: new Date(Date.now() - (i % 20) * 24 * 3600 * 1000).toISOString(),
}));

export default function ComfortPreviewPage() {
  const { listDensity, setListDensity } = usePreferences();
  const [items, setItems] = useState<ComfortItem[]>(INITIAL_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isVirtualMode, setIsVirtualMode] = useState(false);

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail Sheet state
  const [detailItem, setDetailItem] = useState<DetailItemData | null>(null);
  const [isStackedEditOpen, setIsStackedEditOpen] = useState(false);

  // Undo System
  const { executeUndoable, latestUndo, undo, hasPendingUndo } = useUndoableAction();

  // Active data source
  const currentItems = isVirtualMode ? FIVE_HUNDRED_ITEMS : items;

  // Filtered & searched items
  const filteredItems = useMemo(() => {
    let result = [...currentItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.subtitle.toLowerCase().includes(q) ||
          it.amount.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q)
      );
    }

    if (filters.status !== "all") {
      result = result.filter((it) => it.status === filters.status);
    }

    if (filters.sort === "amount_desc") {
      result.sort((a, b) => b.amountVal - a.amountVal);
    } else if (filters.sort === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [currentItems, searchQuery, filters]);

  // Grouped by time
  const timeGroups = useMemo(() => {
    return groupItemsByTime(filteredItems, (it) => it.date, "id");
  }, [filteredItems]);

  // Handle single item delete with 5-second undo
  const handleDeleteItem = async (item: ComfortItem) => {
    const snapshot = [...items];
    const newItems = items.filter((it) => it.id !== item.id);
    setItems(newItems);

    await executeUndoable({
      id: `del-${item.id}`,
      description: `Pengeluaran "${item.title}" dihapus.`,
      entityType: "transaction",
      actionType: "delete",
      snapshot,
      onRevert: (sn) => {
        setItems(sn);
      },
    });
  };

  // Handle single item reconcile (approve)
  const handleReconcileItem = (item: ComfortItem) => {
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: "approved" } : it))
    );
  };

  // Multi-select actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setIsSelectionMode(false);
      return next;
    });
  };

  const handleLongPress = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds((prev) => new Set(prev).add(id));
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(filteredItems.map((it) => it.id)));
    }
  };

  const handleBulkDelete = async () => {
    const snapshot = [...items];
    const toDeleteIds = new Set(selectedIds);
    const newItems = items.filter((it) => !toDeleteIds.has(it.id));
    setItems(newItems);
    setIsSelectionMode(false);
    setSelectedIds(new Set());

    await executeUndoable({
      id: `bulk-del-${Date.now()}`,
      description: `${toDeleteIds.size} pengeluaran dihapus.`,
      entityType: "transaction",
      actionType: "delete",
      snapshot,
      onRevert: (sn) => {
        setItems(sn);
      },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--cb-canvas,#070707)] text-white pb-32">
      {/* Top App Bar with Selection Mode */}
      <TopAppBar
        title="Ledger Comfort"
        selectionMode={
          isSelectionMode
            ? {
                isActive: true,
                selectedCount: selectedIds.size,
                onCancel: () => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                },
                onSelectAll: handleSelectAll,
                isAllSelected: selectedIds.size === filteredItems.length,
              }
            : undefined
        }
      />

      <main className="max-w-lg mx-auto pt-16 px-4 space-y-4">
        {/* Controls: Density switcher & Virtual Mode toggle */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#737373]">Density:</span>
            {(["compact", "comfortable", "spacious"] as ListDensity[]).map((d) => (
              <button
                key={d}
                type="button"
                data-testid={`density-toggle-${d}`}
                onClick={() => setListDensity(d)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  listDensity === d
                    ? "bg-[var(--color-primary,#ff1e42)] text-white"
                    : "bg-white/[0.06] text-[#a3a3a3] hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="toggle-virtual-mode"
            onClick={() => setIsVirtualMode((v) => !v)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
              isVirtualMode
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : "bg-white/[0.06] border-white/[0.08] text-[#a3a3a3]"
            }`}
          >
            {isVirtualMode ? "500 Items (Virtual)" : "5 Items (Normal)"}
          </button>
        </div>

        {/* Search Bar with 200ms debounce and FilterSheet */}
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          filters={filters}
          onOpenFilter={() => setIsFilterOpen(true)}
          onResetFilters={() => setFilters(INITIAL_FILTER_STATE)}
          placeholder="Cari transaksi (cth: genset)..."
        />

        {/* Virtualized Mode */}
        {isVirtualMode ? (
          <div data-testid="virtual-mode-container" className="w-full min-h-[400px]">
            <VirtualCardList
              items={filteredItems}
              maxHeight="75vh"
              getItemKey={(it) => it.id}
              renderItem={(item) => (
                <ListItemCard
                  id={`virtual-card-${item.id}`}
                  title={<HighlightText text={item.title} query={searchQuery} />}
                  subtitle={item.subtitle}
                  amount={item.amount}
                  density={listDensity}
                />
              )}
            />
          </div>
        ) : (
          /* Normal Grouped Mode with SwipeableCard */
          <div data-testid="normal-mode-container" className="space-y-4">
            {timeGroups.length === 0 ? (
              searchQuery ? (
                <SearchNoResultState query={searchQuery} onClear={() => setSearchQuery("")} />
              ) : filters.status !== "all" ? (
                <FilterNoResultState onReset={() => setFilters(INITIAL_FILTER_STATE)} />
              ) : (
                <LedgerEmptyState onLogExpense={() => {}} />
              )
            ) : (
              timeGroups.map((group) => (
                <div key={group.key} data-testid={`time-group-${group.key}`} className="space-y-2">
                  <SectionHeader title={group.label} count={group.items.length} sticky />
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <SwipeableCard
                          key={item.id}
                          id={`card-${item.id}`}
                          cardProps={{
                            id: `item-card-${item.id}`,
                            variant: isSelected
                              ? "selected"
                              : item.variant || (item.status === "pending" ? "urgent" : "default"),
                            density: listDensity,
                            title: <HighlightText text={item.title} query={searchQuery} />,
                            subtitle: item.subtitle,
                            amount: item.amount,
                            selected: isSelected,
                            onSelectToggle: isSelectionMode ? () => toggleSelect(item.id) : undefined,
                            onCardClick: () => {
                              if (isSelectionMode) {
                                toggleSelect(item.id);
                              } else {
                                setDetailItem({
                                  id: item.id,
                                  title: item.title,
                                  subtitle: item.subtitle,
                                  amount: item.amount,
                                  status: item.status,
                                  category: item.category,
                                  date: item.date,
                                  metadata: [
                                    { label: "Kategori", value: item.category },
                                    { label: "Nominal", value: item.amount },
                                  ],
                                });
                              }
                            },
                            onLongPress: () => handleLongPress(item.id),
                          }}
                          leftAction={{
                            id: `delete-${item.id}`,
                            label: "Hapus Transaksi",
                            icon: Trash2,
                            onTrigger: () => handleDeleteItem(item),
                          }}
                          rightAction={{
                            id: `reconcile-${item.id}`,
                            label: "Tandai Selesai",
                            icon: Check,
                            onTrigger: () => handleReconcileItem(item),
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Filter BottomSheet */}
      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        statuses={[
          { id: "all", label: "Semua Status" },
          { id: "approved", label: "Approved" },
          { id: "pending", label: "Pending" },
        ]}
      />

      {/* Bulk Action Bar */}
      {isSelectionMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          progress={selectedIds.size > 10 ? 50 : undefined}
        />
      )}

      {/* Item Detail Sheet with Stacked Edit */}
      <ItemDetailSheet
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        onEdit={() => setIsStackedEditOpen(true)}
        onDelete={() => {
          if (detailItem) {
            const found = items.find((i) => i.id === detailItem.id);
            if (found) handleDeleteItem(found);
            setDetailItem(null);
          }
        }}
        isStackedEditOpen={isStackedEditOpen}
        onCloseStackedEdit={() => setIsStackedEditOpen(false)}
      />

      {/* 5-Second Undo Toast */}
      {latestUndo && (
        <div
          data-testid="undo-toast"
          className="fixed bottom-6 left-4 right-4 max-w-sm mx-auto z-[60] p-4 rounded-2xl bg-[#141414] border border-white/[0.12] shadow-2xl flex items-center justify-between gap-3 animate-slide-up"
        >
          <span data-testid="undo-toast-message" className="text-xs text-white font-medium flex-1">
            {latestUndo.description}
          </span>
          <button
            type="button"
            data-testid="undo-btn"
            onClick={() => undo()}
            className="px-3.5 py-1.5 rounded-full bg-[var(--color-primary,#ff1e42)] text-white text-xs font-semibold hover:brightness-110 active:scale-95 transition-all"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}
