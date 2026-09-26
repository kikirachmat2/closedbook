"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, X, AlertTriangle, Disc3 } from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";

export interface RecordedAudioData {
  audioBase64: string;
  mimeType: string;
  durationSeconds: number;
  sizeBytes: number;
}

export interface VoiceRecordingProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (data: RecordedAudioData) => void;
  maxSeconds?: number; // 60s max as per requirement
  maxSizeBytes?: number; // 10 MB max as per requirement
}

export default function VoiceRecording({
  isOpen,
  onClose,
  onRecordingComplete,
  maxSeconds = 60,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
}: VoiceRecordingProps) {
  const { triggerHaptic } = useHaptic();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check MediaRecorder & getUserMedia browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport =
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof window.MediaRecorder !== "undefined";
      setIsSupported(hasSupport);
    }
  }, []);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    stopTracks();
    setIsRecording(false);
  }, [stopTracks]);

  const handleCancel = useCallback(() => {
    triggerHaptic("light");
    audioChunksRef.current = [];
    stopRecording();
    onClose();
  }, [triggerHaptic, stopRecording, onClose]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    setElapsedSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detect best supported audio MIME type
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm";
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });

        if (audioBlob.size > maxSizeBytes) {
          setErrorMessage(
            `Ukuran audio melebihi batas 10 MB (${(audioBlob.size / (1024 * 1024)).toFixed(1)} MB).`
          );
          triggerHaptic("heavy");
          return;
        }

        if (audioBlob.size === 0) {
          setErrorMessage("Tidak ada data audio yang terekam.");
          return;
        }

        // Convert to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          if (base64Data) {
            onRecordingComplete({
              audioBase64: base64Data,
              mimeType,
              durationSeconds: elapsedSeconds,
              sizeBytes: audioBlob.size,
            });
            onClose();
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(250); // collect in 250ms chunks
      setIsRecording(true);
      triggerHaptic("medium");

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setElapsedSeconds(elapsed);
        if (elapsed >= maxSeconds) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Izin akses mikrofon ditolak oleh browser.");
      } else {
        setErrorMessage(`Gagal mengakses mikrofon: ${err.message || "Error"}`);
      }
      setIsRecording(false);
      stopTracks();
    }
  }, [maxSizeBytes, maxSeconds, onRecordingComplete, onClose, stopRecording, stopTracks, triggerHaptic, elapsedSeconds]);

  // Handle open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      if (isSupported) {
        startRecording();
      }
    } else {
      stopRecording();
    }
    return () => {
      stopRecording();
    };
  }, [isOpen, isSupported, startRecording, stopRecording]);

  if (!isOpen) return null;

  if (!isSupported) {
    return (
      <div
        data-testid="audio-recording-unsupported"
        className="p-3 bg-[#1c1c1c] border border-white/[0.1] rounded-2xl flex items-center justify-between text-xs text-amber-300"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Perekaman audio resolusi tinggi tidak didukung pada browser ini.</span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#9ca3af] hover:text-white"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      data-testid="voice-recording-modal"
      className="p-4 bg-[#141414] border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[var(--color-primary,#ff1e42)] animate-ping" />
          <span className="text-xs font-semibold text-[#fdfdfd]">
            {isRecording ? "Merekam Audio (Gemini Multimodal)..." : "Memproses..."}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#fdfdfd] px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
            {formatTimer(elapsedSeconds)} / {formatTimer(maxSeconds)}
          </span>
          <button
            type="button"
            onClick={handleCancel}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#9ca3af] hover:text-[#fdfdfd] transition-colors"
            aria-label="Batal merekam"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Multimodal Audio Pulsing Waves */}
      <div className="flex items-center justify-center gap-1.5 h-12 py-2 bg-black/40 rounded-xl border border-white/[0.06]">
        {[30, 60, 95, 45, 80, 100, 70, 50, 85, 40, 65, 90, 35, 75].map((h, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-[var(--color-primary,#ff1e42)] to-rose-400"
            style={{
              height: `${Math.max(20, (h * (isRecording ? 1 : 0.2)))}%`,
              animation: isRecording ? "pulse 0.8s ease-in-out infinite" : "none",
              animationDelay: `${(i * 60) % 600}ms`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] text-[#9ca3af] flex items-center gap-1.5">
          <Disc3 className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)] animate-spin" />
          <span>Maks 60 detik / 10 MB (Zero-Retention)</span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic("heavy");
            stopRecording();
          }}
          className="flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[var(--color-primary,#ff1e42)] hover:brightness-110 text-white text-xs font-medium shadow-md transition-all active:scale-95"
          aria-label="Selesai dan kirim audio"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Selesai</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
