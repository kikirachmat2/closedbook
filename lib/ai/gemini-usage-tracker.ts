// =========================================================================
// CLOSEDBOOK PRODUCTION OS — GEMINI RATE LIMIT & USAGE TRACKER (ADR-011)
// Client-side cost transparency, runaway prevention (20 calls/hr), and circuit breaker
// =========================================================================

import { db, GeminiUsageRecord } from "@/lib/db/schema";

export const MAX_CALLS_PER_HOUR = 20;
export const WARNING_CALLS_PER_HOUR = 16;
export const CIRCUIT_BREAKER_MAX_FAILURES = 5;
export const CIRCUIT_BREAKER_LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const FAILURE_COUNT_KEY = "cb_gemini_consecutive_failures";
const CIRCUIT_LOCK_KEY = "cb_gemini_circuit_lock_until";

export interface RateLimitStatus {
  allowed: boolean;
  callsInLastHour: number;
  remainingCalls: number;
  resetMinutes: number;
  isApproachingLimit: boolean;
  warning?: string;
}

export interface CircuitBreakerStatus {
  tripped: boolean;
  minutesRemaining: number;
  consecutiveFailures: number;
}

/**
 * Returns the current month period string (YYYY-MM)
 */
export function getCurrentPeriod(date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Records a Gemini API call in Dexie database
 */
export async function recordGeminiUsage(entry: {
  callType: "chat" | "audio" | "vision";
  model: string;
  status: "success" | "error";
  promptTokens?: number;
  candidateTokens?: number;
  totalTokens?: number;
  errorMessage?: string;
  timestamp?: number;
}): Promise<string> {
  const timestamp = entry.timestamp || Date.now();
  const id = `usage-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
  const period = getCurrentPeriod(new Date(timestamp));

  const record: GeminiUsageRecord = {
    id,
    timestamp,
    callType: entry.callType,
    model: entry.model,
    promptTokens: entry.promptTokens || 0,
    candidateTokens: entry.candidateTokens || 0,
    totalTokens: entry.totalTokens || 0,
    period,
    status: entry.status,
    errorMessage: entry.errorMessage,
  };

  try {
    await db.gemini_usage.add(record);
  } catch (err) {
    // If Dexie fails, silently continue to avoid breaking chat flow
    console.warn("Could not save gemini_usage record to Dexie:", err);
  }

  // Update circuit breaker state
  if (entry.status === "error") {
    recordGeminiFailure();
  } else {
    recordGeminiSuccess();
  }

  return id;
}

/**
 * Checks current hourly rate limit status for BYOK
 */
export async function checkGeminiRateLimit(): Promise<RateLimitStatus> {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  try {
    const recentRecords = await db.gemini_usage
      .where("timestamp")
      .above(oneHourAgo)
      .toArray();

    const count = recentRecords.length;
    const remaining = Math.max(0, MAX_CALLS_PER_HOUR - count);
    const isApproaching = count >= WARNING_CALLS_PER_HOUR && count < MAX_CALLS_PER_HOUR;
    const allowed = count < MAX_CALLS_PER_HOUR;

    let warning: string | undefined;
    if (!allowed) {
      warning = `Batas panggilan Gemini tercapai (${MAX_CALLS_PER_HOUR}/jam). Mohon tunggu beberapa menit.`;
    } else if (isApproaching) {
      warning = `Peringatan: Anda telah melakukan ${count}/${MAX_CALLS_PER_HOUR} panggilan AI dalam 1 jam terakhir.`;
    }

    return {
      allowed,
      callsInLastHour: count,
      remainingCalls: remaining,
      resetMinutes: 60,
      isApproachingLimit: isApproaching,
      warning,
    };
  } catch {
    // Fallback if DB query fails: allow call
    return {
      allowed: true,
      callsInLastHour: 0,
      remainingCalls: MAX_CALLS_PER_HOUR,
      resetMinutes: 60,
      isApproachingLimit: false,
    };
  }
}

/**
 * Checks if circuit breaker is currently active
 */
export function checkCircuitBreaker(): CircuitBreakerStatus {
  if (typeof window === "undefined") {
    return { tripped: false, minutesRemaining: 0, consecutiveFailures: 0 };
  }

  const lockUntil = Number(localStorage.getItem(CIRCUIT_LOCK_KEY) || 0);
  const now = Date.now();

  if (lockUntil > now) {
    const msRemaining = lockUntil - now;
    const minutesRemaining = Math.ceil(msRemaining / (60 * 1000));
    return {
      tripped: true,
      minutesRemaining,
      consecutiveFailures: CIRCUIT_BREAKER_MAX_FAILURES,
    };
  }

  const failures = Number(localStorage.getItem(FAILURE_COUNT_KEY) || 0);
  return {
    tripped: false,
    minutesRemaining: 0,
    consecutiveFailures: failures,
  };
}

/**
 * Records a failure and trips the breaker if threshold reached
 */
export function recordGeminiFailure(): { tripped: boolean; lockUntil?: number } {
  if (typeof window === "undefined") return { tripped: false };

  const currentFailures = Number(localStorage.getItem(FAILURE_COUNT_KEY) || 0) + 1;
  localStorage.setItem(FAILURE_COUNT_KEY, currentFailures.toString());

  if (currentFailures >= CIRCUIT_BREAKER_MAX_FAILURES) {
    const lockUntil = Date.now() + CIRCUIT_BREAKER_LOCK_DURATION_MS;
    localStorage.setItem(CIRCUIT_LOCK_KEY, lockUntil.toString());
    return { tripped: true, lockUntil };
  }

  return { tripped: false };
}

/**
 * Resets consecutive failure counter on a successful call
 */
export function recordGeminiSuccess(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAILURE_COUNT_KEY, "0");
  localStorage.removeItem(CIRCUIT_LOCK_KEY);
}

/**
 * Aggregates monthly usage statistics for Settings UI
 */
export async function getMonthlyGeminiUsage(period = getCurrentPeriod()): Promise<{
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
}> {
  try {
    const records = await db.gemini_usage
      .where("period")
      .equals(period)
      .toArray();

    let successfulCalls = 0;
    let failedCalls = 0;
    let totalTokens = 0;

    for (const r of records) {
      if (r.status === "success") {
        successfulCalls += 1;
        totalTokens += r.totalTokens || 0;
      } else {
        failedCalls += 1;
      }
    }

    return {
      totalCalls: records.length,
      successfulCalls,
      failedCalls,
      totalTokens,
    };
  } catch {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
    };
  }
}
