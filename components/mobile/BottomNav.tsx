"use client";

import React, { useRef } from "react";
import { Receipt, CheckSquare, WalletCards, FileSpreadsheet, Settings } from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";
import { usePreferences } from "@/lib/preferences";

export type MobileTabId = "transactions" | "tasks" | "pockets" | "callsheet" | "settings";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  badges?: {
    transactions?: boolean;
    tasks?: boolean;
    pockets?: boolean;
    callsheet?: boolean;
    settings?: boolean;
  };
}

interface NavTabItem {
  id: MobileTabId;
  label: string;
  icon: React.ElementType;
  badgeKey?: keyof NonNullable<BottomNavProps["badges"]>;
}

const TABS: NavTabItem[] = [
  { id: "transactions", label: "Ledger", icon: Receipt, badgeKey: "transactions" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, badgeKey: "tasks" },
  { id: "pockets", label: "Cash Drawer", icon: WalletCards, badgeKey: "pockets" },
  { id: "callsheet", label: "Docs", icon: FileSpreadsheet, badgeKey: "callsheet" },
  { id: "settings", label: "Settings", icon: Settings, badgeKey: "settings" },
];

/**
 * BottomNav — 5-Tab Hick's Law & Serial Position Mobile Navigation.
 * - Ledger (1st position, left anchor)
 * - Tasks (2nd)
 * - Cash Drawer (3rd, center hub)
 * - Docs (4th)
 * - Settings (5th position, right anchor)
 *
 * Adheres to:
 * - Hick's Law: Exactly 5 items for zero cognitive fatigue.
 * - Fitts's Law: 100% thumb zone reachability, button target height ≥ 56px.
 * - Von Restorff Effect: Crimson highlight strictly reserved for active tab.
 * - W3C WAI-ARIA tablist pattern with keyboard arrow navigation.
 */
export default function BottomNav({ activeTab, onTabChange, badges = {} }: BottomNavProps) {
  const { triggerHaptic } = useHaptic();
  const { setIsSettingsOpen } = usePreferences();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabClick = (tabId: MobileTabId, e?: React.MouseEvent) => {
    e?.preventDefault();
    triggerHaptic("light");
    if (tabId === "settings") {
      setIsSettingsOpen(true);
    } else {
      onTabChange(tabId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === "ArrowRight") {
      targetIndex = (index + 1) % TABS.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = TABS.length - 1;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      const targetTab = TABS[targetIndex];
      tabRefs.current[targetIndex]?.focus();
      handleTabClick(targetTab.id);
    }
  };

  return (
    <nav
      id="mobile-bottom-nav"
      role="tablist"
      aria-label="Main Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070707]/95 backdrop-blur-xl border-t border-white/[0.08] px-1 pb-[env(safe-area-inset-bottom,0px)]"
      style={{
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id || (tab.id === "transactions" && activeTab === "overview");
          const Icon = tab.icon;
          const hasBadge = tab.badgeKey ? Boolean(badges[tab.badgeKey]) : false;

          return (
            <button
              type="button"
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={(e) => handleTabClick(tab.id, e)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 select-none ${
                isActive
                  ? "text-[var(--color-primary,#ff1e42)] font-semibold scale-105"
                  : "text-[var(--color-stone,#737373)] hover:text-[var(--color-paper,#fdfdfd)] font-normal"
              }`}
            >
              <div className="relative">
                <Icon
                  className="w-6 h-6 shrink-0 transition-transform duration-150"
                  aria-hidden="true"
                />
                {hasBadge && (
                  <span
                    data-testid={`badge-dot-${tab.id}`}
                    aria-label="Notification alert"
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[var(--color-primary,#ff1e42)] ring-2 ring-[#070707] animate-pulse"
                  />
                )}
              </div>
              <span className="text-[11px] leading-tight mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
