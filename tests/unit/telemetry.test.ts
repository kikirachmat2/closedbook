import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/lib/db/schema";
import {
  getCurrentPeriod,
  incrementCounter,
  getCounter,
  trackDriveApiCall,
  trackGeminiAudio,
  trackInngestStep,
  getMonthlyRollup,
  CircuitBreakerError,
} from "@/lib/db/telemetry";

describe("Telemetry Counters & Circuit Breaker (Unit / Dexie)", () => {
  beforeEach(async () => {
    await db.telemetry_counters.clear();
  });

  it("increments counters with monthly rollup period format YYYY-MM", async () => {
    const period = getCurrentPeriod();
    expect(period).toMatch(/^\d{4}-\d{2}$/);

    const res1 = await incrementCounter("drive_api_calls", 5, period);
    expect(res1.count).toBe(5);

    const res2 = await incrementCounter("drive_api_calls", 3, period);
    expect(res2.count).toBe(8);

    const current = await getCounter("drive_api_calls", period);
    expect(current).toBe(8);
  });

  it("isolates counters across different monthly periods", async () => {
    await incrementCounter("drive_api_calls", 10, "2026-08");
    await incrementCounter("drive_api_calls", 25, "2026-09");

    const aug = await getCounter("drive_api_calls", "2026-08");
    const sep = await getCounter("drive_api_calls", "2026-09");

    expect(aug).toBe(10);
    expect(sep).toBe(25);
  });

  it("tracks specialized helper functions for Drive, Gemini audio, and Inngest", async () => {
    await trackDriveApiCall(2);
    await trackGeminiAudio(45);
    await trackInngestStep(1);

    const rollup = await getMonthlyRollup();
    expect(rollup.drive_api_calls).toBe(2);
    expect(rollup.gemini_audio_seconds).toBe(45);
    expect(rollup.inngest_steps).toBe(1);
  });

  it("trips circuit breaker and prevents increment when threshold is exceeded", async () => {
    const period = "2026-09";
    const lowThreshold = 10;

    // Increment up to 9 — should pass
    await incrementCounter("drive_api_calls", 9, period, lowThreshold);
    expect(await getCounter("drive_api_calls", period)).toBe(9);

    // Attempting to add 2 would reach 11 (> 10) — should trip circuit breaker
    await expect(
      incrementCounter("drive_api_calls", 2, period, lowThreshold)
    ).rejects.toThrow(CircuitBreakerError);

    // Value in Dexie should remain 9
    expect(await getCounter("drive_api_calls", period)).toBe(9);
  });
});
