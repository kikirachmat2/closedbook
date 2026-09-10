"use client";

import React from "react";
import { usePreferences, CurrencyCode, LanguageCode, ThemeCode } from "@/lib/preferences";
import { X, Check, Globe, DollarSign, Palette, Sparkles, Bell } from "lucide-react";

export default function PreferencesModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currency,
    setCurrency,
    language,
    setLanguage,
    theme,
    setTheme,
    isRemindersEnabled,
    setIsRemindersEnabled,
    isWebNotificationsEnabled,
    setIsWebNotificationsEnabled,
    currencies,
    languages,
    themes,
    t,
  } = usePreferences();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="surface-panel w-full sm:max-w-2xl rounded-t-[24px] sm:rounded-[18px] p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 border border-white/[0.1] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))] flex items-center justify-center text-[var(--color-primary,#ff1e42)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-paper,#fdfdfd)]">
                {t("settingsTitle")}
              </h2>
              <p className="text-xs text-[var(--color-stone,#737373)] mt-0.5">
                {t("settingsSub")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close preferences"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--color-stone,#737373)] hover:text-[var(--color-paper,#fdfdfd)] hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. CURRENCY SELECTOR */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#737373)]">
                {t("currency")} ({currencies[currency].symbol} - {currencies[currency].name})
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(currencies) as CurrencyCode[]).map((code) => {
                const c = currencies[code];
                const isSelected = currency === code;
                return (
                  <button
                    key={code}
                    onClick={() => setCurrency(code)}
                    className={`min-h-[52px] p-3 rounded-[12px] text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? "bg-[var(--accent-badge-bg,rgba(255,30,66,0.1))] border-[var(--color-primary,#ff1e42)] shadow-sm"
                        : "surface-overlay border-white/[0.06] hover:border-white/[0.15]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{c.flag}</span>
                      <div>
                        <div className="text-xs font-semibold text-[var(--color-paper,#fdfdfd)] flex items-center gap-1">
                          {c.code}
                          <span className="font-mono text-[11px] text-[var(--color-stone,#737373)]">({c.symbol})</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-stone,#737373)] truncate max-w-[90px]">
                          {c.name}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[var(--color-primary,#ff1e42)] flex items-center justify-center text-white shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. LANGUAGE SELECTOR */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#737373)]">
                {t("language")} ({languages[language].nativeName})
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(languages) as LanguageCode[]).map((code) => {
                const lang = languages[code];
                const isSelected = language === code;
                return (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`min-h-[52px] p-3 rounded-[12px] text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? "bg-[var(--accent-badge-bg,rgba(255,30,66,0.1))] border-[var(--color-primary,#ff1e42)] shadow-sm"
                        : "surface-overlay border-white/[0.06] hover:border-white/[0.15]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{lang.flag}</span>
                      <div>
                        <div className="text-xs font-semibold text-[var(--color-paper,#fdfdfd)]">
                          {lang.nativeName}
                        </div>
                        <div className="text-[10px] text-[var(--color-stone,#737373)] uppercase">
                          {lang.name}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[var(--color-primary,#ff1e42)] flex items-center justify-center text-white shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. THEME SELECTOR */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#737373)]">
                {t("theme")} ({themes[theme].name})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(themes) as ThemeCode[]).map((code) => {
                const th = themes[code];
                const isSelected = theme === code;
                return (
                  <button
                    key={code}
                    onClick={() => setTheme(code)}
                    className={`min-h-[72px] p-3.5 rounded-[14px] text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? "border-[var(--color-primary,#ff1e42)] shadow-md bg-[var(--accent-badge-bg,rgba(255,30,66,0.08))]"
                        : "surface-overlay border-white/[0.06] hover:border-white/[0.18]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center gap-2">
                        {/* Theme color swatch */}
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: th.accentColor }}
                        />
                        <span className="text-xs font-semibold text-[var(--color-paper,#fdfdfd)]">
                          {th.name}
                        </span>
                      </div>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-[var(--color-primary,#ff1e42)] flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/10"
                            style={{ backgroundColor: th.bgPreview }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/10"
                            style={{ backgroundColor: th.panelPreview }}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-stone,#737373)] line-clamp-2">
                      {th.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. NOTIFICATIONS & REMINDERS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#737373)]">
                {t("notificationsAndReminders")}
              </h3>
            </div>
            <div className="space-y-3">
              {/* In-app reminder toggle */}
              <div className="surface-overlay p-3.5 sm:p-4 rounded-[14px] border border-white/[0.06] flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-paper,#fdfdfd)]">
                    {t("enableInAppReminders")}
                  </div>
                  <div className="text-[11px] text-[var(--color-stone,#737373)] mt-0.5 leading-relaxed">
                    {t("inAppRemindersDesc")}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="toggle-reminders-btn"
                  onClick={() => setIsRemindersEnabled(!isRemindersEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                    isRemindersEnabled ? "bg-[var(--color-primary,#ff1e42)]" : "bg-white/10"
                  }`}
                  aria-label="Toggle in-app reminders"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      isRemindersEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Native web notifications toggle */}
              <div className="surface-overlay p-3.5 sm:p-4 rounded-[14px] border border-white/[0.06] flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-paper,#fdfdfd)]">
                    {t("enableWebNotifications")}
                  </div>
                  <div className="text-[11px] text-[var(--color-stone,#737373)] mt-0.5 leading-relaxed">
                    {t("webNotificationsDesc")}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="toggle-web-notifications-btn"
                  onClick={() => {
                    if (!isWebNotificationsEnabled && typeof window !== "undefined" && "Notification" in window) {
                      Notification.requestPermission().then((perm) => {
                        if (perm === "granted") {
                          setIsWebNotificationsEnabled(true);
                        } else {
                          setIsWebNotificationsEnabled(false);
                        }
                      });
                    } else {
                      setIsWebNotificationsEnabled(!isWebNotificationsEnabled);
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                    isWebNotificationsEnabled ? "bg-[var(--color-primary,#ff1e42)]" : "bg-white/10"
                  }`}
                  aria-label="Toggle web push notifications"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      isWebNotificationsEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 pt-4 border-t border-white/[0.08] flex items-center justify-end">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="btn-primary-crimson text-xs min-h-[44px] px-6 font-medium w-full sm:w-auto"
          >
            {t("savePreferences")}
          </button>
        </div>
      </div>
    </div>
  );
}
