"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, X, Check, AlertCircle } from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";

export interface VoiceInputProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string, autoSend?: boolean) => void;
  maxSeconds?: number;
  autoSendOnStop?: boolean;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
  }
}

export default function VoiceInput({
  isOpen,
  onClose,
  onTranscript,
  maxSeconds = 10,
  autoSendOnStop = false,
}: VoiceInputProps) {
  const { triggerHaptic } = useHaptic();
  const [isRecording, setIsRecording] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(maxSeconds);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");
  transcriptRef.current = transcript;

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const stopRecordingSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleFinish = useCallback((recInstance?: SpeechRecognitionInstance | null) => {
    triggerHaptic("heavy");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = recInstance || recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {}
    }
    setIsRecording(false);

    const finalText = transcriptRef.current.trim();
    if (finalText) {
      onTranscript(finalText, autoSendOnStop);
    }
    onClose();
  }, [triggerHaptic, onTranscript, autoSendOnStop, onClose]);

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "id-ID, en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (e: any) => {
        if (e.error === "no-speech") {
          setErrorMessage("Tidak ada suara terdeteksi. Silakan coba lagi.");
        } else if (e.error === "not-allowed") {
          setErrorMessage("Izin mikrofon ditolak oleh browser.");
        } else {
          setErrorMessage(`Error dikte suara: ${e.error || "Gagal merekam"}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      triggerHaptic("medium");

      // Countdown timer
      let remaining = maxSeconds;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsRemaining(remaining);
        if (remaining <= 0) {
          handleFinish(recognitionRef.current);
        }
      }, 1000);
    } catch {
      setErrorMessage("Tidak dapat memulai perekam suara.");
      setIsRecording(false);
    }
  }, [maxSeconds, triggerHaptic, handleFinish]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingSession();
    };
  }, [stopRecordingSession]);

  // Auto-start recording when opened
  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setErrorMessage(null);
      setSecondsRemaining(maxSeconds);
      if (isSupported) {
        startRecording();
      }
    } else {
      stopRecordingSession();
    }
  }, [isOpen, isSupported, maxSeconds, startRecording, stopRecordingSession]);

  const handleCancel = () => {
    triggerHaptic("light");
    stopRecordingSession();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="voice-input-container"
      className="p-3 bg-[#181818] border border-white/[0.12] rounded-2xl shadow-xl flex flex-col gap-2.5 animate-in slide-in-from-bottom-2 duration-150"
    >
      {!isSupported ? (
        <div className="flex items-center justify-between text-xs text-amber-300 px-1 py-0.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Input suara tidak didukung di browser ini. Gunakan Chrome atau Android.
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 rounded-lg hover:bg-white/10 text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-[var(--color-primary,#ff1e42)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-primary,#ff1e42)]"></span>
              </div>
              <span className="text-xs font-semibold text-[#fdfdfd]">
                {isRecording ? "Mendengarkan..." : "Selesai"}
              </span>
              <span className="text-[10px] font-mono text-[#9ca3af] px-1.5 py-0.5 rounded bg-white/[0.05]">
                {secondsRemaining}s / {maxSeconds}s
              </span>
            </div>

            {/* Cancel & Finish Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#9ca3af] hover:text-[#fdfdfd] transition-colors"
                aria-label="Batal input suara"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleFinish()}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[var(--color-primary,#ff1e42)] hover:brightness-110 text-white shadow transition-all active:scale-95"
                aria-label="Kirim hasil suara"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Waveform Animation */}
          {isRecording && (
            <div
              data-testid="voice-waveform"
              className="flex items-center justify-center gap-1 h-6 py-1"
            >
              {[40, 75, 100, 60, 90, 45, 80, 50, 70, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-[var(--color-primary,#ff1e42)] rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i % 5) * 120}ms`,
                    animationDuration: "600ms",
                  }}
                />
              ))}
            </div>
          )}

          {/* Transcript Preview */}
          <div className="min-h-[32px] px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-[#fdfdfd]/90 font-sans">
            {transcript ? (
              <span>{transcript}</span>
            ) : (
              <span className="text-[#9ca3af] italic">
                Bicara sekarang (contoh: &quot;Berapa pengeluaran catering hari ini?&quot;)...
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="text-[11px] text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
