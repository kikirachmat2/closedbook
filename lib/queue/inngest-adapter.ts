// =========================================================================
// CLOSEDBOOK PRODUCTION OS — INNGEST QUEUE ADAPTER (ADR-002, G.1)
// =========================================================================

import { Inngest } from "inngest";
import { QueueAdapter, QueueResult } from "./adapter";

export const inngest = new Inngest({
  id: "closedbook",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export class InngestQueueAdapter implements QueueAdapter {
  private client: Inngest;

  constructor(client: Inngest = inngest) {
    this.client = client;
  }

  public async enqueue<T = any, R = any>(
    name: string,
    data: T
  ): Promise<QueueResult<R>> {
    const res = await this.client.send({
      name,
      data: data as any,
    });

    const eventId = res?.ids?.[0] || `inngest_${crypto.randomUUID()}`;
    return {
      jobId: eventId,
      status: "queued",
    };
  }
}
