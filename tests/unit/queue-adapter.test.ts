import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DirectQueueAdapter } from "@/lib/queue/direct-adapter";
import { InngestQueueAdapter } from "@/lib/queue/inngest-adapter";
import { getQueueAdapter, setQueueAdapter } from "@/lib/queue/adapter";

describe("Queue Adapters (Inngest & Direct Fallback)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    setQueueAdapter(null);
  });

  afterEach(() => {
    process.env = originalEnv;
    setQueueAdapter(null);
  });

  it("direct adapter executes registered handler synchronously/in-process", async () => {
    const direct = new DirectQueueAdapter();

    direct.registerHandler("ledger/recalculate", async (data: { count: number }) => {
      return { total: data.count * 100 };
    });

    const result = await direct.enqueue("ledger/recalculate", { count: 5 });

    expect(result.status).toBe("completed");
    expect(result.jobId).toContain("direct_job_");
    expect(result.result).toEqual({ total: 500 });
  });

  it("direct adapter captures error when handler throws", async () => {
    const direct = new DirectQueueAdapter();

    direct.registerHandler("failing/job", async () => {
      throw new Error("Calculation overflow");
    });

    const result = await direct.enqueue("failing/job", {});

    expect(result.status).toBe("failed");
    expect(result.error).toBe("Calculation overflow");
  });

  it("inngest adapter dispatches event to Inngest client and returns queued status", async () => {
    const mockSend = vi.fn().mockResolvedValue({ ids: ["evt_inngest_abc123"] });
    const mockClient = { send: mockSend } as any;

    const inngestAdapter = new InngestQueueAdapter(mockClient);

    const result = await inngestAdapter.enqueue("sync/compaction.requested", {
      projectId: "proj_feature_1",
    });

    expect(result.status).toBe("queued");
    expect(result.jobId).toBe("evt_inngest_abc123");
    expect(mockSend).toHaveBeenCalledWith({
      name: "sync/compaction.requested",
      data: { projectId: "proj_feature_1" },
    });
  });

  it("getQueueAdapter chooses DirectAdapter by default when no INNGEST_EVENT_KEY", () => {
    delete process.env.INNGEST_EVENT_KEY;
    const adapter = getQueueAdapter();
    expect(adapter).toBeInstanceOf(DirectQueueAdapter);
  });

  it("getQueueAdapter chooses InngestQueueAdapter when INNGEST_EVENT_KEY is configured", () => {
    process.env.INNGEST_EVENT_KEY = "test_event_key_123";
    const adapter = getQueueAdapter();
    expect(adapter).toBeInstanceOf(InngestQueueAdapter);
  });
});
