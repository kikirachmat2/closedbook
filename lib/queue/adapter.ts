// =========================================================================
// CLOSEDBOOK PRODUCTION OS — QUEUE ADAPTER INTERFACE (ADR-002, G.1)
// =========================================================================

export interface QueueJob<T = any> {
  id: string;
  name: string;
  data: T;
  createdAt: number;
}

export interface QueueResult<R = any> {
  jobId: string;
  status: "queued" | "completed" | "failed";
  result?: R;
  error?: string;
}

export interface QueueAdapter {
  enqueue<T = any, R = any>(name: string, data: T): Promise<QueueResult<R>>;
}

import { DirectQueueAdapter } from "./direct-adapter";
import { InngestQueueAdapter } from "./inngest-adapter";

let activeAdapter: QueueAdapter | null = null;

export function setQueueAdapter(adapter: QueueAdapter | null) {
  activeAdapter = adapter;
}

/**
 * Returns the active queue adapter.
 * Prefers InngestAdapter if INNGEST_EVENT_KEY is configured,
 * otherwise falls back to DirectAdapter for standalone execution.
 */
export function getQueueAdapter(): QueueAdapter {
  if (activeAdapter) {
    return activeAdapter;
  }

  if (process.env.INNGEST_EVENT_KEY) {
    activeAdapter = new InngestQueueAdapter();
  } else {
    activeAdapter = new DirectQueueAdapter();
  }

  return activeAdapter;
}
