// =========================================================================
// CLOSEDBOOK PRODUCTION OS — DIRECT QUEUE ADAPTER (FALLBACK)
// =========================================================================

import { QueueAdapter, QueueResult } from "./adapter";

export type JobHandler<T = any, R = any> = (data: T) => Promise<R> | R;

export class DirectQueueAdapter implements QueueAdapter {
  private handlers = new Map<string, JobHandler>();

  public registerHandler<T = any, R = any>(
    name: string,
    handler: JobHandler<T, R>
  ): void {
    this.handlers.set(name, handler);
  }

  public async enqueue<T = any, R = any>(
    name: string,
    data: T
  ): Promise<QueueResult<R>> {
    const jobId = `direct_job_${crypto.randomUUID()}`;
    const handler = this.handlers.get(name);

    if (!handler) {
      // Default echo fallback when no explicit worker is attached
      return {
        jobId,
        status: "completed",
        result: data as unknown as R,
      };
    }

    try {
      const result = await handler(data);
      return {
        jobId,
        status: "completed",
        result,
      };
    } catch (err: any) {
      return {
        jobId,
        status: "failed",
        error: err.message || "Job execution failed in DirectQueueAdapter",
      };
    }
  }
}
