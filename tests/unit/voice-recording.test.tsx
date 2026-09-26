/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import VoiceRecording from "../../components/mobile/VoiceRecording";

describe("VoiceRecording Component (Task 8 - Gemini Audio Tier 2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as any).MediaRecorder;
    delete (navigator as any).mediaDevices;
  });

  it("renders fallback message when MediaRecorder is unsupported", () => {
    const onClose = vi.fn();
    const onComplete = vi.fn();

    render(
      <VoiceRecording
        isOpen={true}
        onClose={onClose}
        onRecordingComplete={onComplete}
      />
    );

    expect(
      screen.getByText(/perekaman audio resolusi tinggi tidak didukung/i)
    ).toBeDefined();

    const closeBtn = screen.getByRole("button", { name: /tutup/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("initializes recording UI when MediaRecorder is supported", async () => {
    const mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });

    class MockMediaRecorder {
      state = "recording";
      start = vi.fn();
      stop = vi.fn();
      ondataavailable = null;
      onstop = null;
      static isTypeSupported = () => true;
    }

    (window as any).MediaRecorder = MockMediaRecorder;

    const onClose = vi.fn();
    const onComplete = vi.fn();

    await act(async () => {
      render(
        <VoiceRecording
          isOpen={true}
          onClose={onClose}
          onRecordingComplete={onComplete}
          maxSeconds={60}
        />
      );
    });

    // Verify UI displays recording state and time limits
    expect(screen.getByText(/merekam audio/i)).toBeDefined();
    expect(screen.getByText(/00:00 \/ 01:00/i)).toBeDefined();
    expect(screen.getByText(/maks 60 detik \/ 10 mb/i)).toBeDefined();

    const cancelBtn = screen.getByRole("button", { name: /batal merekam/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
