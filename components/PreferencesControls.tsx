"use client";

import React from "react";
import { usePreferences } from "@/lib/preferences";
import { Settings, Globe, DollarSign, Palette } from "lucide-react";

export default function PreferencesControls({ compact = false }: { compact?: boolean }) {
  const {
    currency,
    language,
    theme,
    setIsSettingsOpen,
    currencies,
    languages,
    themes,
  } = usePreferences();

  if (compact) {
    return (
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="min-h-[44px] px-3 rounded-full surface-overlay border border-white/[0.08] hover:border-white/[0.2] flex items-center gap-2 text-xs text-[var(--color-pearl,#d4d4d4)] hover:text-[var(--color-paper,#fdfdfd)] transition-all"
        title="Preferences (Currency, Language, Theme)"
      >
        <span className="text-sm">{currencies[currency].flag}</span>
        <span className="font-mono text-[11px] font-medium">{currency}</span>
        <span className="text-white/20">|</span>
        <span className="text-xs uppercase font-medium">{language}</span>
        <span className="text-white/20">|</span>
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: themes[theme].accentColor }}
        />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Currency Quick Trigger */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="min-h-[44px] px-2.5 sm:px-3 rounded-full surface-overlay border border-white/[0.08] hover:border-white/[0.2] flex items-center gap-1.5 text-xs text-[var(--color-pearl,#d4d4d4)] hover:text-[var(--color-paper,#fdfdfd)] transition-all"
        title="Change Currency"
      >
        <span className="text-sm">{currencies[currency].flag}</span>
        <span className="font-mono font-medium text-[11px] sm:text-xs">
          {currencies[currency].symbol} {currency}
        </span>
      </button>

      {/* Language Quick Trigger */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="min-h-[44px] px-2.5 sm:px-3 rounded-full surface-overlay border border-white/[0.08] hover:border-white/[0.2] flex items-center gap-1.5 text-xs text-[var(--color-pearl,#d4d4d4)] hover:text-[var(--color-paper,#fdfdfd)] transition-all"
        title="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-[var(--color-stone,#737373)]" />
        <span className="uppercase font-medium text-[11px] sm:text-xs">
          {language}
        </span>
      </button>

      {/* Theme Quick Trigger */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="min-h-[44px] px-2.5 sm:px-3 rounded-full surface-overlay border border-white/[0.08] hover:border-white/[0.2] flex items-center gap-1.5 text-xs text-[var(--color-pearl,#d4d4d4)] hover:text-[var(--color-paper,#fdfdfd)] transition-all"
        title={`Theme: ${themes[theme].name}`}
      >
        <div
          className="w-2.5 h-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: themes[theme].accentColor }}
        />
        <span className="hidden lg:inline text-[11px] text-[var(--color-stone,#737373)]">
          {themes[theme].name.split(" ")[0]}
        </span>
        <Settings className="w-3 h-3 text-[var(--color-stone,#737373)] ml-0.5" />
      </button>
    </div>
  );
}
