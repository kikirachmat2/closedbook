// =========================================================================
// CLOSEDBOOK PRODUCTION OS — DRIVE TOKEN BUCKET RATE LIMITER (ADR-004)
// =========================================================================

export interface RateLimiterOptions {
  capacity?: number; // Maximum burst tokens
  refillRatePerSec?: number; // Tokens added per second
  lockName?: string;
}

export class DriveRateLimiter {
  private capacity: number;
  private refillRatePerSec: number;
  private tokens: number;
  private lastRefillTimestamp: number;
  private lockName: string;

  constructor(options: RateLimiterOptions = {}) {
    this.capacity = options.capacity ?? 60;
    this.refillRatePerSec = options.refillRatePerSec ?? 5;
    this.tokens = this.capacity;
    this.lastRefillTimestamp = Date.now();
    this.lockName = options.lockName ?? "cb_drive_rate_limit";
  }

  /**
   * Refills tokens based on elapsed time since last refill.
   */
  private refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    if (elapsedSeconds > 0) {
      const addedTokens = elapsedSeconds * this.refillRatePerSec;
      this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Attempts to consume tokens. Returns wait time in ms if not enough tokens.
   */
  public tryConsume(tokensToConsume = 1): { allowed: boolean; waitTimeMs: number } {
    this.refill();

    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      return { allowed: true, waitTimeMs: 0 };
    }

    const deficit = tokensToConsume - this.tokens;
    const waitTimeMs = Math.ceil((deficit / this.refillRatePerSec) * 1000);
    return { allowed: false, waitTimeMs };
  }

  /**
   * Acquires permission to dispatch a Drive API call, coordinating across tabs via Web Locks API.
   */
  public async acquire(tokensToConsume = 1, timeoutMs = 15000): Promise<boolean> {
    const executeAcquire = async (): Promise<boolean> => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        const { allowed, waitTimeMs } = this.tryConsume(tokensToConsume);
        if (allowed) {
          return true;
        }
        const sleepMs = Math.min(waitTimeMs, 1000);
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
      }
      return false; // Timeout
    };

    // If Web Locks API is available (browser environment), guard acquisition across tabs
    if (typeof navigator !== "undefined" && "locks" in navigator) {
      return (navigator as any).locks.request(this.lockName, async () => {
        return executeAcquire();
      });
    }

    return executeAcquire();
  }

  public getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Calculates exponential backoff with Full Jitter for 429/503 retry handling.
 * Formula: min(maxMs, baseMs * 2^attempt) + random(0, baseMs)
 */
export function calculateBackoffDelay(
  attempt: number,
  baseMs = 1000,
  maxMs = 30000
): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  const jitter = Math.random() * baseMs;
  return Math.floor(exponential + jitter);
}

// Global Singleton Rate Limiter
export const driveRateLimiter = new DriveRateLimiter();
