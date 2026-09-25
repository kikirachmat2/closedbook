// =========================================================================
// CLOSEDBOOK PRODUCTION OS — DEXIE TELEMETRY & CIRCUIT BREAKER (ADR-002, G.1)
// =========================================================================

import { db, TelemetryCounterRecord } from "./schema";

export type TelemetryKey =
  | "drive_api_calls"
  | "gemini_audio_seconds"
  | "inngest_steps";

export interface CircuitBreakerThresholds {
  drive_api_calls: number;
  gemini_audio_seconds: number;
  inngest_steps: number;
}

// Default monthly hard ceilings to prevent unexpected cost or rate limit exhaustion
export const DEFAULT_THRESHOLDS: CircuitBreakerThresholds = {
  drive_api_calls: 20_000, // 20k API calls / month
  gemini_audio_seconds: 7_200, // 2 hours of audio / month
  inngest_steps: 50_000, // 50k steps / month
};

export class CircuitBreakerError extends Error {
  public key: TelemetryKey;
  public current: number;
  public threshold: number;

  constructor(key: TelemetryKey, current: number, threshold: number) {
    super(
      `Circuit breaker tripped for ${key}: current value ${current} exceeds monthly threshold ${threshold}`
    );
    this.name = "CircuitBreakerError";
    this.key = key;
    this.current = current;
    this.threshold = threshold;
  }
}

/**
 * Returns current calendar month period in 'YYYY-MM' format.
 */
export function getCurrentPeriod(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Generates primary key for telemetry counter table: `${key}_${period}`
 */
export function getCounterId(key: TelemetryKey, period: string): string {
  return `${key}_${period}`;
}

/**
 * Retrieves the count for a given metric and period.
 */
export async function getCounter(
  key: TelemetryKey,
  period: string = getCurrentPeriod()
): Promise<number> {
  const id = getCounterId(key, period);
  const record = await db.telemetry_counters.get(id);
  return record ? record.count : 0;
}

/**
 * Checks whether incrementing a counter would trip the circuit breaker.
 */
export async function assertCircuitBreaker(
  key: TelemetryKey,
  amountToAdd: number = 1,
  period: string = getCurrentPeriod(),
  customThreshold?: number
): Promise<void> {
  const current = await getCounter(key, period);
  const threshold = customThreshold ?? DEFAULT_THRESHOLDS[key];

  if (current + amountToAdd > threshold) {
    throw new CircuitBreakerError(key, current + amountToAdd, threshold);
  }
}

/**
 * Increments a telemetry metric while strictly enforcing the circuit breaker.
 */
export async function incrementCounter(
  key: TelemetryKey,
  amount: number = 1,
  period: string = getCurrentPeriod(),
  customThreshold?: number
): Promise<{ count: number; period: string }> {
  await assertCircuitBreaker(key, amount, period, customThreshold);

  const id = getCounterId(key, period);
  const now = Date.now();

  const updatedCount = await db.transaction("rw", db.telemetry_counters, async () => {
    const existing = await db.telemetry_counters.get(id);
    const newCount = (existing ? existing.count : 0) + amount;

    await db.telemetry_counters.put({
      id,
      key,
      period,
      count: newCount,
      updatedAt: now,
    });

    return newCount;
  });

  return { count: updatedCount, period };
}

/**
 * Records Google Drive API calls with monthly rollup.
 */
export async function trackDriveApiCall(calls: number = 1): Promise<number> {
  const res = await incrementCounter("drive_api_calls", calls);
  return res.count;
}

/**
 * Records Gemini audio seconds consumed with monthly rollup.
 */
export async function trackGeminiAudio(seconds: number): Promise<number> {
  const res = await incrementCounter("gemini_audio_seconds", seconds);
  return res.count;
}

/**
 * Records Inngest queue background steps with monthly rollup.
 */
export async function trackInngestStep(steps: number = 1): Promise<number> {
  const res = await incrementCounter("inngest_steps", steps);
  return res.count;
}

/**
 * Returns a complete monthly rollup of all tracked telemetry metrics.
 */
export async function getMonthlyRollup(
  period: string = getCurrentPeriod()
): Promise<Record<TelemetryKey, number>> {
  const [driveCalls, audioSeconds, inngestSteps] = await Promise.all([
    getCounter("drive_api_calls", period),
    getCounter("gemini_audio_seconds", period),
    getCounter("inngest_steps", period),
  ]);

  return {
    drive_api_calls: driveCalls,
    gemini_audio_seconds: audioSeconds,
    inngest_steps: inngestSteps,
  };
}
