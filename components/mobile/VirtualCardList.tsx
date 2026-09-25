"use client";

import React, { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePreferences, ListDensity } from "@/lib/preferences";

export interface VirtualCardListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  estimateSize?: (density: ListDensity) => number;
  overscan?: number;
  scrollRestorationKey?: string;
  emptyComponent?: React.ReactNode;
  className?: string;
  maxHeight?: string | number;
}

const DENSITY_ITEM_HEIGHTS: Record<ListDensity, number> = {
  compact: 64, // 56px card + 8px gap
  comfortable: 80, // 72px card + 8px gap
  spacious: 96, // 88px card + 8px gap
};

export default function VirtualCardList<T>({
  items,
  renderItem,
  getItemKey,
  estimateSize,
  overscan = 5,
  scrollRestorationKey,
  emptyComponent,
  className = "",
  maxHeight = "70vh",
}: VirtualCardListProps<T>) {
  const { listDensity } = usePreferences();
  const parentRef = useRef<HTMLDivElement>(null);

  const baseItemHeight = estimateSize
    ? estimateSize(listDensity)
    : DENSITY_ITEM_HEIGHTS[listDensity] || 80;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => baseItemHeight,
    overscan,
  });

  // Scroll restoration support
  useEffect(() => {
    if (!scrollRestorationKey || !parentRef.current) return;
    try {
      const savedPosition = sessionStorage.getItem(`scroll_pos_${scrollRestorationKey}`);
      if (savedPosition) {
        const top = parseInt(savedPosition, 10);
        if (!isNaN(top)) {
          parentRef.current.scrollTop = top;
        }
      }
    } catch {
      // Ignore sessionStorage errors (e.g. incognito)
    }

    const scrollElement = parentRef.current;
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (scrollElement) {
          try {
            sessionStorage.setItem(
              `scroll_pos_${scrollRestorationKey}`,
              scrollElement.scrollTop.toString()
            );
          } catch {}
        }
      }, 150);
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [scrollRestorationKey]);

  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      data-testid="virtual-card-list-scroll-parent"
      className={`overflow-y-auto w-full scrollbar-thin ${className}`}
      style={{
        maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        contain: "strict",
      }}
    >
      <div
        data-testid="virtual-card-list-height-container"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          const key = getItemKey
            ? getItemKey(item, virtualRow.index)
            : virtualRow.key ?? virtualRow.index;

          return (
            <div
              key={key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "8px", // spacing between cards
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
