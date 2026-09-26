"use client";

import React, { useState, useEffect } from "react";
import { usePreferences, CurrencyCode, LanguageCode, ThemeCode, ListDensity } from "@/lib/preferences";
import { X, Check, Globe, DollarSign, Palette, Sparkles, Bell, ExternalLink, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, LayoutList, BarChart3 } from "lucide-react";

import { testGeminiApiKey } from "@/lib/ai/gemini-client";
import {
  saveGeminiApiKey,
  getGeminiApiKey,
  removeGeminiApiKey,
  getGeminiKeyStatus,
  setGeminiKeyStatus,
} from "@/lib/ai/gemini-key-storage";
import {
  getMonthlyGeminiUsage,
  getCurrentPeriod,
} from "@/lib/ai/gemini-usage-tracker";

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
    listDensity,
    setListDensity,
    isRemindersEnabled,
    setIsRemindersEnabled,
    isWebNotificationsEnabled,
    setIsWebNotificationsEnabled,
    isHapticsEnabled,
    setIsHapticsEnabled,
    fabPosition,
    setFabPosition,
    geminiApiKey,
    setGeminiApiKey,
    currencies,
    languages,
    themes,
    t,
  } = usePreferences();

  const [tempKey, setTempKey] = useState(geminiApiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "invalid">("idle");
  const [testErrorMsg, setTestErrorMsg] = useState<string | null>(null);
  const [keyStatus, setKeyStatusState] = useState<"active" | "invalid" | "none">("none");
  const [usageStats, setUsageStats] = useState({
    totalCalls: 0,
    totalTokens: 0,
    period: getCurrentPeriod(),
  });

  useEffect(() => {
    let isMounted = true;
    async function loadKeyAndUsage() {
      const stored = await getGeminiApiKey();
      const current = stored || geminiApiKey || "";
      const stats = await getMonthlyGeminiUsage();
      if (isMounted) {
        setTempKey(current);
        const status = getGeminiKeyStatus();
        setKeyStatusState(current ? status : "none");
        setTestStatus("idle");
        setTestErrorMsg(null);
        setUsageStats({
          totalCalls: stats.totalCalls,
          totalTokens: stats.totalTokens,
          period: getCurrentPeriod(),
        });
      }
    }
    if (isSettingsOpen) {
      loadKeyAndUsage();
    }
    return () => {
      isMounted = false;
    };
  }, [geminiApiKey, isSettingsOpen]);

  const handleTestConnection = async () => {
    const keyToTest = (tempKey || geminiApiKey).trim();
    if (!keyToTest) return;
    setTestStatus("testing");
    setTestErrorMsg(null);

    const result = await testGeminiApiKey(keyToTest);
    if (result.success) {
      setTestStatus("success");
      setKeyStatusState("active");
      setGeminiKeyStatus("active");
    } else {
      setTestStatus("invalid");
      setKeyStatusState("invalid");
      setGeminiKeyStatus("invalid");
      setTestErrorMsg(result.message);
    }
  };

  const handleRemoveKey = async () => {
    await removeGeminiApiKey();
    setGeminiApiKey("");
    setTempKey("");
    setTestStatus("idle");
    setTestErrorMsg(null);
    setKeyStatusState("none");
  };

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
              <p className="text-xs text-[var(--color-stone,#9ca3af)] mt-0.5">
                {t("settingsSub")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close preferences"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--color-stone,#9ca3af)] hover:text-[var(--color-paper,#fdfdfd)] hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. CURRENCY SELECTOR */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#9ca3af)]">
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
                          <span className="font-mono text-[11px] text-[var(--color-stone,#9ca3af)]">({c.symbol})</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-stone,#9ca3af)] truncate max-w-[90px]">
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#9ca3af)]">
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
                        <div className="text-[10px] text-[var(--color-stone,#9ca3af)] uppercase">
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#9ca3af)]">
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
                    <p className="text-[11px] text-[var(--color-stone,#9ca3af)] line-clamp-2">
                      {th.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LIST DENSITY PREFERENCE */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LayoutList className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#9ca3af)]">
                {t("listDensity")}
              </h3>
            </div>
            <p className="text-[11px] text-[var(--color-stone,#9ca3af)] mb-3">
              {t("listDensityDesc")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: "comfortable",
                    name: t("densityComfortable"),
                    desc: t("densityComfortableDesc"),
                    height: "72px",
                  },
                  {
                    id: "compact",
                    name: t("densityCompact"),
                    desc: t("densityCompactDesc"),
                    height: "56px",
                  },
                  {
                    id: "spacious",
                    name: t("densitySpacious"),
                    desc: t("densitySpaciousDesc"),
                    height: "88px",
                  },
                ] as const
              ).map((d) => {
                const isSelected = listDensity === d.id;
                return (
                  <button
                    key={d.id}
                    id={`density-option-${d.id}`}
                    type="button"
                    onClick={() => setListDensity(d.id)}
                    className={`min-h-[72px] p-3.5 rounded-[14px] text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? "border-[var(--color-primary,#ff1e42)] shadow-md bg-[var(--accent-badge-bg,rgba(255,30,66,0.08))]"
                        : "surface-overlay border-white/[0.06] hover:border-white/[0.18]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-semibold text-[var(--color-paper,#fdfdfd)]">
                        {d.name}
                      </span>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-[var(--color-primary,#ff1e42)] flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--color-stone,#9ca3af)] font-mono">
                          {d.height}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-stone,#9ca3af)] line-clamp-2">
                      {d.desc}
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#9ca3af)]">
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
                  <div className="text-[11px] text-[var(--color-stone,#9ca3af)] mt-0.5 leading-relaxed">
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
                  <div className="text-[11px] text-[var(--color-stone,#9ca3af)] mt-0.5 leading-relaxed">
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

              {/* Tactile Haptic Feedback Toggle */}
              <div className="surface-overlay p-3.5 rounded-[12px] border border-white/[0.06] flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-paper,#fdfdfd)]">
                    {t("hapticFeedback")}
                  </div>
                  <div className="text-[11px] text-[var(--color-stone,#9ca3af)] leading-relaxed">
                    {t("hapticFeedbackDesc")}
                  </div>
                </div>
                <button
                  type="button"
                  id="haptics-toggle-btn"
                  onClick={() => setIsHapticsEnabled(!isHapticsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                    isHapticsEnabled ? "bg-[var(--color-primary,#ff1e42)]" : "bg-white/10"
                  }`}
                  aria-label="Toggle haptic vibration feedback"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      isHapticsEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* FAB Ergonomic Placement (Fitts's Law) */}
              <div className="surface-overlay p-3.5 rounded-[12px] border border-white/[0.06] space-y-2">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-paper,#fdfdfd)]">
                    {t("fabPlacement")}
                  </div>
                  <div className="text-[11px] text-[var(--color-stone,#9ca3af)] leading-relaxed">
                    {t("fabPlacementDesc")}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    id="fab-position-right"
                    onClick={() => setFabPosition("right")}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                      fabPosition === "right"
                        ? "bg-[var(--accent-badge-bg,rgba(255,30,66,0.1))] border-[var(--color-primary,#ff1e42)] text-[var(--color-paper,#fdfdfd)]"
                        : "surface-overlay border-white/[0.08] text-[var(--color-stone,#9ca3af)] hover:text-white"
                    }`}
                  >
                    <span>👉 {t("fabRight")}</span>
                  </button>
                  <button
                    type="button"
                    id="fab-position-left"
                    onClick={() => setFabPosition("left")}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                      fabPosition === "left"
                        ? "bg-[var(--accent-badge-bg,rgba(255,30,66,0.1))] border-[var(--color-primary,#ff1e42)] text-[var(--color-paper,#fdfdfd)]"
                        : "surface-overlay border-white/[0.08] text-[var(--color-stone,#9ca3af)] hover:text-white"
                    }`}
                  >
                    <span>👈 {t("fabLeft")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. AI ASSISTANT (GEMINI 2.0 FLASH BYOK) */}
          <div data-testid="settings-ai-section">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone,#9ca3af)]">
                AI Assistant (Gemini BYOK)
              </h3>
            </div>
            <p className="text-[11px] text-[var(--color-stone,#9ca3af)] leading-relaxed mb-2.5">
              ClosedBook Assistant ditenagai oleh model Google Gemini 2.0 Flash langsung dari perangkat Anda (Zero-Server-Retention, ADR-011). Kunci API dienkripsi lokal dengan WebCrypto AES-GCM.
            </p>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary,#ff1e42)] hover:underline mb-3 font-medium"
            >
              <span>Cara dapat API key gratis →</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="surface-overlay p-3.5 sm:p-4 rounded-[14px] border border-white/[0.06] space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="gemini-api-key-input" className="block text-[11px] font-medium text-[var(--color-paper,#fdfdfd)]">
                    Gemini API Key
                  </label>
                  {/* Status Indicator: Key active / Key invalid / No key set */}
                  <div id="gemini-key-status-indicator" data-testid="gemini-key-status-indicator">
                    {keyStatus === "active" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#10b981] font-medium bg-[#10b981]/10 px-2 py-0.5 rounded-full border border-[#10b981]/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Key active</span>
                      </span>
                    ) : keyStatus === "invalid" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#ef4444] font-medium bg-[#ef4444]/10 px-2 py-0.5 rounded-full border border-[#ef4444]/20">
                        <AlertCircle className="w-3 h-3" />
                        <span>Key invalid</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#9ca3af] font-medium bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.1]">
                        <span>No key set</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="gemini-api-key-input"
                    data-testid="gemini-api-key-input"
                    type={showKey ? "text" : "password"}
                    value={tempKey}
                    onChange={(e) => {
                      setTempKey(e.target.value);
                      setTestStatus("idle");
                      setTestErrorMsg(null);
                      if (!e.target.value.trim()) {
                        setKeyStatusState("none");
                      }
                    }}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#181818] border border-white/[0.1] rounded-xl px-3.5 pr-20 min-h-[44px] text-xs text-[#fdfdfd] placeholder-[#525252] font-mono focus:outline-none focus:border-[var(--color-primary,#ff1e42)] transition-colors"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#fdfdfd] transition-colors"
                      aria-label={showKey ? "Hide API key" : "Show API key"}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {tempKey && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempKey("");
                          setTestStatus("idle");
                          setTestErrorMsg(null);
                          setKeyStatusState("none");
                        }}
                        className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#fdfdfd] transition-colors"
                        aria-label="Clear API key"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {testErrorMsg && (
                  <p className="text-[11px] text-[#ef4444] mt-1.5 leading-tight">{testErrorMsg}</p>
                )}
              </div>

              {/* Action buttons: [Test Connection] [Remove Key] */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-test-gemini-key"
                    data-testid="btn-test-gemini-key"
                    disabled={!tempKey.trim() || testStatus === "testing"}
                    onClick={handleTestConnection}
                    className="btn-ghost-pill text-xs min-h-[38px] px-3.5 flex items-center gap-2 border border-white/[0.1] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed text-[#fdfdfd]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)] ${testStatus === "testing" ? "animate-spin" : ""}`} />
                    <span>{testStatus === "testing" ? "Menguji..." : "Test Connection"}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-remove-gemini-key"
                    data-testid="btn-remove-gemini-key"
                    disabled={!tempKey.trim() && keyStatus === "none"}
                    onClick={handleRemoveKey}
                    className="btn-ghost-pill text-xs min-h-[38px] px-3.5 flex items-center gap-1.5 border border-white/[0.1] hover:bg-white/[0.06] hover:text-[#ef4444] disabled:opacity-40 disabled:cursor-not-allowed text-[#9ca3af]"
                  >
                    <span>Remove Key</span>
                  </button>
                </div>

                {testStatus === "success" && (
                  <div className="flex items-center gap-1.5 text-xs text-[#10b981] font-medium bg-[#10b981]/10 px-2.5 py-1 rounded-full border border-[#10b981]/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Koneksi Berhasil</span>
                  </div>
                )}
              </div>

              {/* Usage & Cost Transparency (ADR-011) */}
              <div
                data-testid="gemini-usage-stats"
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 text-[#9ca3af]">
                  <BarChart3 className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                  <span>Penggunaan Bulan Ini ({usageStats.period})</span>
                </div>
                <div className="font-mono text-[#fdfdfd] font-medium">
                  {usageStats.totalCalls} panggilan ({usageStats.totalTokens.toLocaleString()} token)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 pt-4 border-t border-white/[0.08] flex items-center justify-end">
          <button
            id="btn-save-preferences"
            data-testid="btn-save-preferences"
            onClick={async () => {
              if (tempKey.trim()) {
                await saveGeminiApiKey(tempKey.trim());
                setGeminiApiKey(tempKey.trim());
              } else {
                await removeGeminiApiKey();
                setGeminiApiKey("");
              }
              setIsSettingsOpen(false);
            }}
            className="btn-primary-crimson text-xs min-h-[44px] px-6 font-medium w-full sm:w-auto cursor-pointer"
          >
            {t("savePreferences")}
          </button>
        </div>
      </div>
    </div>
  );
}
