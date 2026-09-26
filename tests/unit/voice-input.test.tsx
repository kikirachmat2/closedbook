/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import VoiceInput from "../../components/mobile/VoiceInput";

describe("VoiceInput Component (Task 7)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it("renders fallback message when Web Speech API is not supported (e.g. iOS Safari)", () => {
    const onClose = vi.fn();
    const onTranscript = vi.fn();

    render(
      <VoiceInput
        isOpen={true}
        onClose={onClose}
        onTranscript={onTranscript}
      />
    );

    expect(
      screen.getByText(/input suara tidak didukung di browser ini/i)
    ).toBeDefined();

    const closeBtn = screen.getByRole("button", { name: /tutup pesan/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("activates listening state, countdown timer, and waveform when Web Speech API is mocked", () => {
    const mockStart = vi.fn();
    const mockStop = vi.fn();
    const mockAbort = vi.fn();

    class MockSpeechRecognition {
      continuous = false;
      interimResults = true;
      lang = "id-ID";
      start = mockStart;
      stop = mockStop;
      abort = mockAbort;
      onresult = null;
      onerror = null;
      onend = null;
    }

    (window as any).webkitSpeechRecognition = MockSpeechRecognition;

    const onClose = vi.fn();
    const onTranscript = vi.fn();

    const { container } = render(
      <VoiceInput
        isOpen={true}
        onClose={onClose}
        onTranscript={onTranscript}
        maxSeconds={10}
      />
    );

    expect(mockStart).toHaveBeenCalled();
    expect(screen.getByText(/mendengarkan\.\.\./i)).toBeDefined();
    expect(screen.getByText(/10s \/ 10s/i)).toBeDefined();

    // Verify waveform bars are rendered
    const waveform = container.querySelector('[data-testid="voice-waveform"]');
    expect(waveform).not.toBeNull();

    // Advance timer by 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/7s \/ 10s/i)).toBeDefined();
  });

  it("cancels recording and triggers onClose when cancel button is clicked", () => {
    const mockAbort = vi.fn();
    class MockSpeechRecognition {
      start = vi.fn();
      stop = vi.fn();
      abort = mockAbort;
    }
    (window as any).webkitSpeechRecognition = MockSpeechRecognition;

    const onClose = vi.fn();
    const onTranscript = vi.fn();

    render(
      <VoiceInput
        isOpen={true}
        onClose={onClose}
        onTranscript={onTranscript}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /batal input suara/i });
    fireEvent.click(cancelBtn);

    expect(mockAbort).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(onTranscript).not.toHaveBeenCalled();
  });
});
