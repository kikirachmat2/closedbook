// =========================================================================
// CLOSEDBOOK PRODUCTION OS — INNGEST API WEBHOOK ROUTE (G.1)
// =========================================================================

import { serve } from "inngest/next";
import { inngest } from "@/lib/queue/inngest-adapter";

const syncCompactionFunction = inngest.createFunction(
  {
    id: "sync-compaction-job",
    triggers: [{ event: "sync/compaction.requested" }],
  },
  async ({ event }: { event: any }) => {
    return {
      status: "completed",
      projectId: event?.data?.projectId,
      timestamp: Date.now(),
    };
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncCompactionFunction],
});
