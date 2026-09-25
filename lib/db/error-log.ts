// =========================================================================
// CLOSEDBOOK PRODUCTION OS — LOCAL ERROR LOGGER (ADR-006)
// =========================================================================

import { db, ErrorLogRecord } from "./schema";

export async function logLocalError({
  level = "error",
  message,
  stack,
  context,
}: {
  level?: "info" | "warn" | "error" | "fatal";
  message: string;
  stack?: string;
  context?: Record<string, any>;
}): Promise<number | undefined> {
  try {
    const record: ErrorLogRecord = {
      timestamp: Date.now(),
      level,
      message,
      stack,
      context,
      resolved: false,
    };

    const id = await db.error_logs.add(record);

    // Keep error logs table bounded to recent 200 entries to prevent local storage bloat
    const count = await db.error_logs.count();
    if (count > 200) {
      const oldest = await db.error_logs.orderBy("id").limit(count - 200).keys();
      await db.error_logs.bulkDelete(oldest as number[]);
    }

    return id;
  } catch (err) {
    console.error("[Local Error Logger Fallback]:", err, message);
    return undefined;
  }
}

export async function getRecentErrorLogs(limit = 50): Promise<ErrorLogRecord[]> {
  return db.error_logs.orderBy("timestamp").reverse().limit(limit).toArray();
}

export async function clearResolvedErrors(): Promise<void> {
  await db.error_logs.where("resolved").equals(1).delete();
}
