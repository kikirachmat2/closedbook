"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export interface SectionHeaderProps {
  id?: string;
  title: string;
  count?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  sticky?: boolean;
  className?: string;
}

export default function SectionHeader({
  id,
  title,
  count,
  isCollapsed = false,
  onToggleCollapse,
  sticky = true,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      id={id}
      data-testid="section-header"
      className={`${
        sticky ? "sticky top-0 z-20" : "relative"
      } min-h-[32px] h-[32px] flex items-center justify-between px-3.5 bg-[var(--cb-canvas,#0a0a0a)] border-b border-white/[0.04] select-none transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        disabled={!onToggleCollapse}
        aria-expanded={!isCollapsed}
        className={`w-full flex items-center justify-between py-1 text-left ${
          onToggleCollapse ? "cursor-pointer group" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] uppercase tracking-widest font-mono text-[#a3a3a3] group-hover:text-white transition-colors">
            {title}
          </span>
          {typeof count === "number" && (
            <span
              data-testid="section-header-count"
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[#737373]"
            >
              {count}
            </span>
          )}
        </div>

        {onToggleCollapse && (
          <ChevronDown
            data-testid="section-header-chevron"
            className={`w-3.5 h-3.5 text-[#737373] transition-transform duration-200 group-hover:text-white ${
              isCollapsed ? "-rotate-90" : "rotate-0"
            }`}
          />
        )}
      </button>
    </div>
  );
}
