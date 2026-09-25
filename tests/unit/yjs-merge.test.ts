import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import {
  createInitialManifest,
  registerDeltaInManifest,
  shouldTriggerCompaction,
  compileCompactedManifest,
} from "@/lib/sync/manifest";

describe("Yjs Deterministic Merge & Manifest Compaction (ADR-002, ADR-004)", () => {
  it("merges concurrent offline updates deterministically without data loss", () => {
    // 1. Common initial base document
    const docBase = new Y.Doc();
    const taskMapBase = docBase.getMap("tasks");
    taskMapBase.set("task-101", {
      title: "Genset Rental",
      vendor: "Vendor A",
      status: "in_progress",
    });

    const initialSnapshot = Y.encodeStateAsUpdate(docBase);

    // 2. Client A (UPM offline in field) updates vendor notes
    const docClientA = new Y.Doc();
    Y.applyUpdate(docClientA, initialSnapshot);
    const taskMapA = docClientA.getMap("tasks");
    taskMapA.set("task-101", {
      title: "Genset Rental",
      vendor: "Vendor B (60kVA High Output)", // UPM change
      status: "in_progress",
    });
    const deltaA = Y.encodeStateAsUpdate(docClientA, Y.encodeStateVector(docBase));

    // 3. Client B (Line Producer at basecamp) completes the task
    const docClientB = new Y.Doc();
    Y.applyUpdate(docClientB, initialSnapshot);
    const taskMapB = docClientB.getMap("tasks");
    taskMapB.set("task-101", {
      title: "Genset Rental",
      vendor: "Vendor A",
      status: "completed", // LP change
    });
    const deltaB = Y.encodeStateAsUpdate(docClientB, Y.encodeStateVector(docBase));

    // 4. Synchronization (exchange deltas between Client A and Client B)
    Y.applyUpdate(docClientA, deltaB);
    Y.applyUpdate(docClientB, deltaA);

    // Both documents must converge to identical state
    const finalA = docClientA.getMap("tasks").get("task-101") as any;
    const finalB = docClientB.getMap("tasks").get("task-101") as any;

    expect(finalA).toEqual(finalB);
    expect(finalA.title).toBe("Genset Rental");
  });

  it("handles manifest lifecycle and compaction trigger correctly", () => {
    let manifest = createInitialManifest();
    expect(manifest.generation).toBe(1);
    expect(manifest.activeDeltas).toHaveLength(0);
    expect(shouldTriggerCompaction(manifest, 50)).toBe(false);

    // Simulate appending 50 delta files
    for (let i = 1; i <= 50; i++) {
      manifest = registerDeltaInManifest(manifest, `deltas/delta_${i}.bin`);
    }

    expect(manifest.activeDeltas).toHaveLength(50);
    expect(shouldTriggerCompaction(manifest, 50)).toBe(true);

    // Perform compaction
    const compacted = compileCompactedManifest({
      currentManifest: manifest,
      newSnapshotPath: "snapshots/snap_gen2.bin",
      snapshotETag: 'etag_"abc123"',
    });

    expect(compacted.generation).toBe(2);
    expect(compacted.activeSnapshot).toBe("snapshots/snap_gen2.bin");
    expect(compacted.activeDeltas).toHaveLength(0); // Deltas reset cleanly
    expect(compacted.snapshotETag).toBe('etag_"abc123"');
  });
});
