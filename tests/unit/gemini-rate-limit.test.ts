import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../../lib/db/schema";
import {
  recordGeminiUsage,
  checkGeminiRateLimit,
  checkCircuitBreaker,
  recordGeminiFailure,
  recordGeminiSuccess,
  getMonthlyGeminiUsage,
  MAX_CALLS_PER_HOUR,
  CIRCUIT_BREAKER_MAX_FAILURES,
} from "../../lib/ai/gemini-usage-tracker";

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

describe("Gemini Rate Limiter, Circuit Breaker & Usage (Task 9 & 10)", () => {
  const mockLocalStorage = new MockStorage();

  beforeEach(async () => {
    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = mockLocalStorage;
    mockLocalStorage.clear();
    await db.gemini_usage.clear();
  });

  it("records usage in Dexie gemini_usage table and calculates monthly totals", async () => {
    await recordGeminiUsage({
      callType: "chat",
      model: "gemini-2.0-flash",
      status: "success",
      promptTokens: 120,
      candidateTokens: 80,
      totalTokens: 200,
    });

    await recordGeminiUsage({
      callType: "audio",
      model: "gemini-2.0-flash",
      status: "success",
      totalTokens: 350,
    });

    const monthly = await getMonthlyGeminiUsage();
    expect(monthly.totalCalls).toBe(2);
    expect(monthly.successfulCalls).toBe(2);
    expect(monthly.totalTokens).toBe(550);
  });

  it("enforces max 20 calls/hour rate limit for BYOK", async () => {
    // Initial state: 0 calls
    const initialStatus = await checkGeminiRateLimit();
    expect(initialStatus.allowed).toBe(true);
    expect(initialStatus.callsInLastHour).toBe(0);
    expect(initialStatus.remainingCalls).toBe(MAX_CALLS_PER_HOUR);

    // Simulate 20 calls within the last hour
    const now = Date.now();
    for (let i = 0; i < MAX_CALLS_PER_HOUR; i++) {
      await recordGeminiUsage({
        callType: "chat",
        model: "gemini-2.0-flash",
        status: "success",
        timestamp: now - i * 1000,
      });
    }

    const limitedStatus = await checkGeminiRateLimit();
    expect(limitedStatus.allowed).toBe(false);
    expect(limitedStatus.callsInLastHour).toBe(20);
    expect(limitedStatus.remainingCalls).toBe(0);
    expect(limitedStatus.warning).toContain("Batas panggilan Gemini tercapai");
  });

  it("trips circuit breaker after 5 consecutive failures and resets on success", () => {
    // Initial circuit breaker: untripped
    let cb = checkCircuitBreaker();
    expect(cb.tripped).toBe(false);
    expect(cb.consecutiveFailures).toBe(0);

    // Record 4 failures: not tripped yet
    for (let i = 0; i < CIRCUIT_BREAKER_MAX_FAILURES - 1; i++) {
      recordGeminiFailure();
    }
    cb = checkCircuitBreaker();
    expect(cb.tripped).toBe(false);
    expect(cb.consecutiveFailures).toBe(4);

    // 5th failure: trips breaker
    const tripResult = recordGeminiFailure();
    expect(tripResult.tripped).toBe(true);

    cb = checkCircuitBreaker();
    expect(cb.tripped).toBe(true);
    expect(cb.minutesRemaining).toBeGreaterThanOrEqual(1);

    // Successful call resets circuit breaker
    recordGeminiSuccess();
    cb = checkCircuitBreaker();
    expect(cb.tripped).toBe(false);
    expect(cb.consecutiveFailures).toBe(0);
  });
});
