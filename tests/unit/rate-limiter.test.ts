import { describe, it, expect } from "vitest";
import { DriveRateLimiter, calculateBackoffDelay } from "@/lib/drive/rate-limiter";

describe("Drive Token Bucket Rate Limiter (ADR-004)", () => {
  it("allows bursts up to configured capacity", () => {
    const limiter = new DriveRateLimiter({ capacity: 5, refillRatePerSec: 1 });

    for (let i = 0; i < 5; i++) {
      const res = limiter.tryConsume(1);
      expect(res.allowed).toBe(true);
    }

    // 6th consume must be disallowed
    const resOver = limiter.tryConsume(1);
    expect(resOver.allowed).toBe(false);
    expect(resOver.waitTimeMs).toBeGreaterThan(0);
  });

  it("calculates exponential backoff with jitter within bounded range", () => {
    const delay0 = calculateBackoffDelay(0, 1000, 30000); // 1000 + [0..1000] = 1000..2000
    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThanOrEqual(2000);

    const delay2 = calculateBackoffDelay(2, 1000, 30000); // 4000 + [0..1000] = 4000..5000
    expect(delay2).toBeGreaterThanOrEqual(4000);
    expect(delay2).toBeLessThanOrEqual(5000);

    const delayLarge = calculateBackoffDelay(10, 1000, 10000); // capped at 10000 + [0..1000] = 10000..11000
    expect(delayLarge).toBeLessThanOrEqual(11000);
  });
});
