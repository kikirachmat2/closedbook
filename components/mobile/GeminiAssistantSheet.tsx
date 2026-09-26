"use client";

import React, { useState, useEffect, useRef } from "react";
import BottomSheet from "./BottomSheet";
import MarkdownRenderer from "./MarkdownRenderer";
import VoiceInput from "./VoiceInput";
import {
  Sparkles,
  Send,
  Mic,
  Bot,
  User,
  Settings,
  Shield,
  Trash2,
  ChevronDown,
  Info,
} from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";
import { usePreferences } from "@/lib/preferences";
import { getGeminiApiKey } from "@/lib/ai/gemini-key-storage";
import {
  streamGeminiContent,
  DEFAULT_GEMINI_MODEL,
  GeminiContentMessage,
} from "@/lib/ai/gemini-client";
import {
  buildProductionContext,
  BASE_SYSTEM_PROMPT,
  AppContextState,
} from "@/lib/ai/context-builder";
import {
  checkGeminiRateLimit,
  checkCircuitBreaker,
  recordGeminiUsage,
  CIRCUIT_BREAKER_MAX_FAILURES,
} from "@/lib/ai/gemini-usage-tracker";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface GeminiAssistantSheetProps {
  isOpen: boolean;
  onClose: () => void;
  appContext?: AppContextState;
  onVoiceClick?: () => void;
}

export default function GeminiAssistantSheet({
  isOpen,
  onClose,
  appContext,
  onVoiceClick,
}: GeminiAssistantSheetProps) {
  const { triggerHaptic } = useHaptic();
  const { setIsSettingsOpen } = usePreferences();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "initial-assistant-msg",
      role: "model",
      text: "Halo! Saya ClosedBook AI Assistant ditenagai Gemini 2.0 Flash. Ada yang bisa saya bantu terkait anggaran produksi, breakdown biaya, atau koordinasi kru hari ini?",
      timestamp: "Baru saja",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeModel, setActiveModel] = useState(DEFAULT_GEMINI_MODEL);
  const [includeContext, setIncludeContext] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const [circuitWarning, setCircuitWarning] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check API key availability when opened
  useEffect(() => {
    async function checkKey() {
      const key = await getGeminiApiKey();
      setHasApiKey(Boolean(key && key.trim().length > 0));
    }
    if (isOpen) {
      checkKey();
    }
  }, [isOpen]);

  // Auto-scroll chat to bottom on updates
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isStreaming) return;

    // 1. Check Circuit Breaker
    const cb = checkCircuitBreaker();
    if (cb.tripped) {
      setCircuitWarning(
        `AI Assistant dinonaktifkan sementara karena ${CIRCUIT_BREAKER_MAX_FAILURES} kegagalan berturut-turut. Tunggu ${cb.minutesRemaining} menit.`
      );
      triggerHaptic("heavy");
      return;
    } else {
      setCircuitWarning(null);
    }

    // 2. Check Rate Limit (20 calls / hr)
    const rateLimit = await checkGeminiRateLimit();
    if (!rateLimit.allowed) {
      setRateLimitWarning(rateLimit.warning || "Batas panggilan AI (20/jam) tercapai.");
      triggerHaptic("heavy");
      return;
    }
    if (rateLimit.isApproachingLimit && rateLimit.warning) {
      setRateLimitWarning(rateLimit.warning);
    } else {
      setRateLimitWarning(null);
    }

    triggerHaptic("medium");
    setInputText("");

    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      setHasApiKey(false);
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text,
      timestamp: "Baru saja",
    };

    const assistantMsgId = `model-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "model",
      text: "",
      timestamp: "Baru saja",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    // 30s Timeout Recovery
    const timeoutTimer = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort("timeout");
      }
    }, 30000);

    // Prepare message history for Gemini API
    const contextPrompt = appContext
      ? buildProductionContext(appContext, {
          includeAppContext: includeContext,
          includeFinancialData: includeFinancials,
        })
      : "";

    const systemInstruction = contextPrompt
      ? `${BASE_SYSTEM_PROMPT}\n\n${contextPrompt}`
      : BASE_SYSTEM_PROMPT;

    // Convert previous chat history
    const apiMessages: GeminiContentMessage[] = messages
      .filter((m) => m.id !== "initial-assistant-msg")
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

    apiMessages.push({
      role: "user",
      parts: [{ text }],
    });

    try {
      const stream = streamGeminiContent({
        apiKey,
        model: activeModel,
        messages: apiMessages,
        systemInstruction,
        abortSignal: abortControllerRef.current.signal,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, text: fullResponse } : msg
          )
        );
      }

      clearTimeout(timeoutTimer);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

      // Record successful usage
      await recordGeminiUsage({
        callType: "chat",
        model: activeModel,
        status: "success",
        totalTokens: Math.round((fullResponse.length + text.length) / 4),
      });
    } catch (err: any) {
      clearTimeout(timeoutTimer);

      let errorText = "";
      if (err.name === "AbortError" || err === "timeout" || abortControllerRef.current?.signal.aborted) {
        errorText = "**Batas Waktu Habis (>30s)**: Gemini tidak merespon dalam 30 detik. Silakan periksa koneksi dan coba lagi.";
      } else if (err.status === 401 || err.code === "INVALID_API_KEY") {
        errorText = "**Kunci API Tidak Valid (401)**: Kunci Gemini Anda tidak dapat digunakan. Silakan perbarui di Pengaturan.";
      } else if (err.status === 429 || err.code === "RATE_LIMIT_EXCEEDED") {
        errorText = "**Batas Permintaan Tercapai (429)**: Terlalu banyak permintaan ke Google Gemini. Silakan tunggu beberapa detik.";
      } else if (err.code === "SAFETY_BLOCKED" || err.message?.includes("SAFETY")) {
        errorText = "**Konten Diblokir**: Respon ditahan oleh filter keamanan Gemini. Silakan ubah susunan kalimat pertanyaan Anda.";
      } else if (typeof navigator !== "undefined" && !navigator.onLine) {
        errorText = "**Mode Offline**: Perangkat Anda tidak terhubung ke internet. Permintaan akan dicoba saat online.";
      } else {
        errorText = `**Terjadi Kesalahan**: ${err?.message || "Gagal menghubungi Gemini"}`;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, text: errorText, isStreaming: false } : msg
        )
      );

      // Record error in usage log
      await recordGeminiUsage({
        callType: "chat",
        model: activeModel,
        status: "error",
        errorMessage: err.message || errorText,
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleClearChat = () => {
    triggerHaptic("light");
    setMessages([
      {
        id: `initial-${Date.now()}`,
        role: "model",
        text: "Percakapan dibersihkan. Ada yang ingin Anda analisis dari produksi ini?",
        timestamp: "Baru saja",
      },
    ]);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title=""
      initialSnap="half"
    >
      <div
        className="flex flex-col h-[75vh] -mx-6 -my-4 text-[var(--color-paper,#fdfdfd)]"
        data-testid="gemini-assistant-sheet"
      >
        {/* Custom Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-[#0c0c0c] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))] flex items-center justify-center text-[var(--color-primary,#ff1e42)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-[#fdfdfd]">Gemini Assistant</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#9ca3af] border border-white/[0.08]">
                  gemini-2.0-flash
                </span>
              </div>
              <p className="text-[10px] text-[#9ca3af]">Autonomous Film Production AI</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearChat}
              className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/[0.05] transition-colors"
              title="Bersihkan percakapan"
              aria-label="Bersihkan riwayat percakapan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Missing API Key Banner */}
        {!hasApiKey && (
          <div
            data-testid="gemini-no-key-warning"
            className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300 shrink-0"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Gemini API Key belum diset. Masukkan key gratis Anda untuk mulai.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsSettingsOpen(true);
              }}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium text-[11px] transition-colors shrink-0"
            >
              Pengaturan
            </button>
          </div>
        )}

        {/* Circuit Breaker Warning Banner */}
        {circuitWarning && (
          <div
            data-testid="gemini-circuit-warning"
            className="p-3 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2 text-xs text-rose-300 shrink-0"
          >
            <Info className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{circuitWarning}</span>
          </div>
        )}

        {/* Rate Limit Warning Banner */}
        {rateLimitWarning && (
          <div
            data-testid="gemini-rate-limit-warning"
            className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-300 shrink-0"
          >
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{rateLimitWarning}</span>
          </div>
        )}

        {/* Context Controls Toggle Bar (Privacy-First) */}
        <div className="flex items-center justify-between px-5 py-2 bg-white/[0.02] border-b border-white/[0.06] text-[11px] text-[#9ca3af] shrink-0">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                id="gemini-toggle-context"
                type="checkbox"
                checked={includeContext}
                onChange={(e) => setIncludeContext(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-[var(--color-primary,#ff1e42)] focus:ring-0 w-3.5 h-3.5"
              />
              <span>Konteks Proyek</span>
            </label>

            {includeContext && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  id="gemini-toggle-financial"
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-[var(--color-primary,#ff1e42)] focus:ring-0 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#10b981]" />
                  <span>Finansial (Opt-In)</span>
                </span>
              </label>
            )}
          </div>

          <span className="text-[10px] font-mono text-[#9ca3af]">Zero-Retention</span>
        </div>

        {/* Chat Messages Stream Area */}
        <div
          ref={chatScrollRef}
          role="log"
          aria-live="polite"
          data-testid="gemini-chat-log"
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser
                      ? "bg-[var(--color-primary,#ff1e42)] text-white"
                      : "bg-white/[0.08] text-[var(--color-primary,#ff1e42)] border border-white/[0.1]"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl ${
                    isUser
                      ? "bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))] border border-[var(--color-primary,#ff1e42)]/25 rounded-tr-sm text-[#fdfdfd]"
                      : "surface-overlay border border-white/[0.08] rounded-tl-sm text-[#fdfdfd]"
                  }`}
                >
                  {isUser ? (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <>
                      <MarkdownRenderer content={msg.text} isStreaming={msg.isStreaming} />
                      {msg.isStreaming && (
                        <div
                          data-testid="gemini-streaming-indicator"
                          className="flex items-center gap-1 mt-2 text-[#9ca3af]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary,#ff1e42)] animate-pulse" />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary,#ff1e42)] animate-pulse"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary,#ff1e42)] animate-pulse"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      )}
                    </>
                  )}
                  <span className="block text-[9px] text-[#9ca3af] mt-1.5 text-right font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar — iOS anti-zoom text (16px font-size minimum) or VoiceInput */}
        <div className="p-3 sm:p-4 bg-[#0a0a0a] border-t border-white/[0.08] shrink-0">
          {isVoiceOpen ? (
            <VoiceInput
              isOpen={isVoiceOpen}
              onClose={() => setIsVoiceOpen(false)}
              onTranscript={(text, autoSend) => {
                setInputText(text);
                setIsVoiceOpen(false);
                if (autoSend) {
                  setTimeout(() => handleSendMessage(text), 100);
                }
              }}
            />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                id="btn-gemini-voice"
                data-testid="btn-gemini-voice"
                onClick={() => {
                  triggerHaptic("medium");
                  if (onVoiceClick) {
                    onVoiceClick();
                  } else {
                    setIsVoiceOpen(true);
                  }
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#9ca3af] hover:text-[#fdfdfd] transition-colors"
                aria-label="Input Suara"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                id="gemini-chat-input"
                data-testid="gemini-chat-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tanyakan jadwal syuting, analisis anggaran..."
                className="flex-1 bg-[#161616] border border-white/[0.1] rounded-xl px-4 min-h-[44px] text-[16px] sm:text-xs text-[#fdfdfd] placeholder-[#9ca3af] focus:outline-none focus:border-[var(--color-primary,#ff1e42)] transition-colors"
              />

              <button
                type="submit"
                id="btn-gemini-send"
                data-testid="btn-gemini-send"
                disabled={!inputText.trim() || isStreaming}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[var(--color-primary,#ff1e42)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md transition-all active:scale-95"
                aria-label="Kirim Pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
