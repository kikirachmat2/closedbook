// =========================================================================
// CLOSEDBOOK PRODUCTION OS — YJS MULTI-TAB RELAY ENGINE (ADR-002)
// =========================================================================

import * as Y from "yjs";
import { db } from "@/lib/db/schema";

export type SyncSlice = "financial" | "operations" | "metadata";

export class YjsProjectManager {
  public readonly projectId: string;
  public readonly slice: SyncSlice;
  public readonly doc: Y.Doc;
  private channel: BroadcastChannel | null = null;
  private isDestroyed = false;

  constructor(projectId: string, slice: SyncSlice = "operations") {
    this.projectId = projectId;
    this.slice = slice;
    this.doc = new Y.Doc();

    this.initBroadcastRelay();
  }

  /**
   * Initializes BroadcastChannel for zero-latency multi-tab sync.
   */
  private initBroadcastRelay() {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }

    const channelName = `cb_yjs_${this.projectId}_${this.slice}`;
    this.channel = new BroadcastChannel(channelName);

    // 1. Listen for updates from other tabs on this machine
    this.channel.onmessage = (event: MessageEvent) => {
      if (this.isDestroyed || !event.data) return;
      try {
        const update = new Uint8Array(event.data);
        Y.applyUpdate(this.doc, update, "broadcast");
      } catch (err) {
        console.warn("[Yjs Relay Apply Error]:", err);
      }
    };

    // 2. Broadcast local updates to other tabs and queue to Dexie
    this.doc.on("update", async (update: Uint8Array, origin: any) => {
      if (this.isDestroyed) return;

      // Broadcast if mutation originated locally (not from peer tab)
      if (origin !== "broadcast" && this.channel) {
        try {
          this.channel.postMessage(update);
        } catch (err) {
          console.warn("[Yjs Relay Broadcast Error]:", err);
        }

        // Persist delta into Dexie for asynchronous Drive sync
        await this.queueDelta(update);
      }
    });
  }

  /**
   * Stores update delta into IndexedDB deltas table.
   */
  private async queueDelta(update: Uint8Array) {
    try {
      await db.deltas.add({
        id: crypto.randomUUID(),
        projectId: this.projectId,
        slice: this.slice,
        timestamp: Date.now(),
        clientId: this.doc.clientID.toString(),
        updateData: update,
        applied: 0, // Pending Drive upload
      });
    } catch (e) {
      // Offline fallback or test environment guard
    }
  }

  /**
   * Applies an external binary update (e.g. from Google Drive delta file).
   */
  public applyRemoteUpdate(update: Uint8Array, origin = "remote_drive") {
    Y.applyUpdate(this.doc, update, origin);
  }

  /**
   * Exports full state as an atomic snapshot.
   */
  public exportSnapshot(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  /**
   * Cleans up channel listeners.
   */
  public destroy() {
    this.isDestroyed = true;
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.doc.destroy();
  }
}
