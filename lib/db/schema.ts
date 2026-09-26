// =========================================================================
// CLOSEDBOOK PRODUCTION OS — DEXIE.JS DATABASE SCHEMA (ADR-002, ADR-006)
// =========================================================================

import Dexie, { Table } from "dexie";
import {
  Project,
  Transaction,
  Task,
  Pocket,
  Department,
  EquipmentRental,
  SystemAlert,
  PocketTransfer,
  ProjectNote,
} from "@/lib/types";

export interface DeltaRecord {
  id: string; // uuid
  projectId: string;
  slice: "financial" | "operations" | "metadata";
  timestamp: number;
  clientId: string;
  updateData: Uint8Array; // Binary Yjs update
  applied: number; // 0 = pending upload, 1 = synced
}

export interface SyncStateRecord {
  projectId: string; // primary key
  lastSyncedAt: number;
  snapshotETag?: string;
  manifestETag?: string;
  pendingDeltaCount: number;
}

export interface ErrorLogRecord {
  id?: number; // auto-increment
  timestamp: number;
  level: "info" | "warn" | "error" | "fatal";
  message: string;
  stack?: string;
  context?: Record<string, any>;
  resolved: boolean;
}

export interface TelemetryCounterRecord {
  id: string; // key_period (e.g. gemini_audio_seconds_2026-09)
  key: string;
  period: string; // YYYY-MM
  count: number;
  updatedAt: number;
}

export interface DocumentGeneratedRecord {
  id: string;
  projectId: string;
  type: "ledger" | "call-sheet" | "wrap-report";
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  generatedAt: string;
}

export class ClosedBookDB extends Dexie {
  projects!: Table<Project, string>;
  transactions!: Table<Transaction & { projectId: string }, string>;
  tasks!: Table<Task & { projectId: string }, string>;
  pockets!: Table<Pocket & { projectId: string }, string>;
  departments!: Table<Department & { projectId: string }, string>;
  equipment!: Table<EquipmentRental & { projectId: string }, string>;
  alerts!: Table<SystemAlert & { projectId: string }, string>;
  transfers!: Table<PocketTransfer & { projectId: string }, string>;
  notes!: Table<ProjectNote & { projectId: string }, string>;
  deltas!: Table<DeltaRecord, string>;
  sync_state!: Table<SyncStateRecord, string>;
  error_logs!: Table<ErrorLogRecord, number>;
  telemetry_counters!: Table<TelemetryCounterRecord, string>;
  documents_generated!: Table<DocumentGeneratedRecord, string>;

  constructor(databaseName = "ClosedBookDB") {
    super(databaseName);

    // Version 1 Schema Definition
    this.version(1).stores({
      projects: "id, slug, name, createdAt",
      transactions: "id, projectId, pocketId, departmentId, date, status, [projectId+status]",
      tasks: "id, projectId, departmentId, status, priority, dueDate, [projectId+status]",
      pockets: "id, projectId, type, [projectId+type]",
      departments: "id, projectId, code",
      equipment: "id, projectId, status, [projectId+status]",
      alerts: "id, projectId, severity, type, resolved",
      transfers: "id, projectId, fromPocketId, toPocketId, timestamp",
      notes: "id, projectId, category, updatedAt",
      deltas: "id, projectId, slice, timestamp, clientId, applied, [projectId+slice+applied]",
      sync_state: "projectId, lastSyncedAt",
      error_logs: "++id, timestamp, level, resolved",
      telemetry_counters: "id, key, period, updatedAt",
    });

    // Version 2 Schema Definition: Track client-generated documents
    this.version(2).stores({
      documents_generated: "id, projectId, type, generatedAt, [projectId+type]",
    });
  }
}

// Global Singleton Instance
export const db = new ClosedBookDB();
