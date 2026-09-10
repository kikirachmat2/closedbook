"use client";

import { useState, useEffect, useRef } from "react";
import {
  Project,
  Department,
  Pocket,
  Transaction,
  Task,
  TaskStatus,
  DailyCallSheet,
  EquipmentRental,
  EquipmentStatus,
  SystemAlert,
  AlertSeverity,
  ContextComment,
  PocketTransfer,
  DailyReconcile,
  ReconcileEntry,
  ProjectShell,
  ProjectNote,
  NoteCategory,
} from "./types";

const INITIAL_PROJECT: Project = {
  id: "proj-001",
  name: "Feature Film: 'The Quiet Horizon'",
  slug: "the-quiet-horizon",
  currency: "USD",
  totalBudget: 120000,
  currentDisbursed: 42350,
  driveFolderId: "1A2B3C_Drive_Closebook_QuietHorizon",
  sheetId: "1X2Y3Z_Sheet_Master_Ledger",
  shootDays: 16,
  startDate: "October 11, 2026",
  director: "Alex Mercer",
  createdAt: new Date().toISOString(),
};

const INITIAL_DEPARTMENTS: Department[] = [
  { id: "cat-ops", name: "Operations & Logistics", code: "OPS", allocatedBudget: 35000, spentAmount: 14650, color: "#14b8a6" },
  { id: "cat-crt", name: "Production & Creative", code: "CRT", allocatedBudget: 45000, spentAmount: 33650, color: "#8b5cf6" },
  { id: "cat-vnd", name: "Vendors & External Services", code: "VND", allocatedBudget: 25000, spentAmount: 10350, color: "#38bdf8" },
  { id: "cat-adm", name: "Administrative & Float", code: "ADM", allocatedBudget: 15000, spentAmount: 4000, color: "#94a3b8" },
];

const INITIAL_POCKETS: Pocket[] = [
  { id: "pkt-master", name: "Producer Master Vault", type: "master_vault", custodian: "Markus Vance (Lead Producer)", balance: 68420, allocated: 120000 },
  { id: "pkt-lp", name: "Line Producer Reserve", type: "operational_pocket", custodian: "Elena Rostova (LP)", balance: 18500, allocated: 30000 },
  { id: "pkt-upm", name: "UPM Field Cash", type: "field_cash", custodian: "Devon Reed (UPM)", balance: 8420, allocated: 15000 },
  { id: "pkt-transport", name: "Unit Transport Float", type: "field_cash", custodian: "Rizal Pratama (Transport Coord)", balance: 1850, allocated: 3500 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "TX-101",
    pocketId: "pkt-upm",
    pocketName: "UPM Field Cash",
    departmentId: "cat-ops",
    departmentName: "Operations & Logistics",
    amount: 380,
    description: "Diesel Fuel for Location Genset (200L)",
    vendor: "Pertamina Energy Depot",
    status: "approved",
    loggedBy: "Rizal Pratama",
    loggedAt: "Today, 14:20",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    receiptUrl: "/icon.png",
    notes: "Stamped by gas station manager.",
  },
  {
    id: "TX-102",
    pocketId: "pkt-upm",
    pocketName: "UPM Field Cash",
    departmentId: "cat-ops",
    departmentName: "Operations & Logistics",
    amount: 640,
    description: "Overtime Hot Dinner for Team (40 Pax)",
    vendor: "Harbor Bistro Catering",
    status: "pending",
    loggedBy: "Sarah Lin",
    loggedAt: "Today, 18:05",
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    receiptUrl: "/icon.png",
    notes: "Ordered due to night schedule extension.",
  },
  {
    id: "TX-103",
    pocketId: "pkt-upm",
    pocketName: "UPM Field Cash",
    departmentId: "cat-crt",
    departmentName: "Production & Creative",
    amount: 190,
    description: "Weathered Wallpaper & Acrylic Primer",
    vendor: "ACE Hardware Central",
    status: "approved",
    loggedBy: "Dina Kartika",
    loggedAt: "Yesterday, 11:30",
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    receiptUrl: "/icon.png",
  },
  {
    id: "TX-104",
    pocketId: "pkt-lp",
    pocketName: "Line Producer Reserve",
    departmentId: "cat-vnd",
    departmentName: "Vendors & External Services",
    amount: 450,
    description: "Additional 1TB CFexpress Type B Media",
    vendor: "Prisma Cine Gear Rental",
    status: "approved",
    loggedBy: "Devon Reed",
    loggedAt: "Yesterday, 09:15",
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    receiptUrl: "/icon.png",
  },
  {
    id: "TX-105",
    pocketId: "pkt-upm",
    pocketName: "UPM Field Cash",
    departmentId: "cat-crt",
    departmentName: "Production & Creative",
    amount: 320,
    description: "Vintage Rotary Telephone Prop Purchase",
    vendor: "Antique Flea Market",
    status: "pending",
    loggedBy: "Dina Kartika",
    loggedAt: "Yesterday, 16:40",
    createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    isMissingReceipt: true,
    notes: "Vendor did not have formal receipt. Cash slip provided.",
  },
];

const INITIAL_TRANSFERS: PocketTransfer[] = [
  {
    id: "TR-101",
    sourcePocketId: "pkt-master",
    sourcePocketName: "Producer Master Vault",
    destPocketId: "pkt-lp",
    destPocketName: "Line Producer Reserve",
    amount: 30000,
    authorizedBy: "Markus Vance (Lead Producer)",
    timestamp: "3 days ago",
    notes: "Week 1 operational line budget release",
  },
  {
    id: "TR-102",
    sourcePocketId: "pkt-lp",
    sourcePocketName: "Line Producer Reserve",
    destPocketId: "pkt-upm",
    destPocketName: "UPM Field Cash",
    amount: 15000,
    authorizedBy: "Elena Rostova (LP)",
    timestamp: "2 days ago",
    notes: "Field operations cash disbursement for harbour filming",
  },
];

const INITIAL_TASKS: Task[] = [
  { id: "tsk-1", departmentId: "cat-ops", departmentName: "Operations & Logistics", title: "Site walkthrough & safety compliance check", assignee: "Rizal Pratama", priority: "high", status: "completed", dueDate: "Day 4" },
  { id: "tsk-2", departmentId: "cat-crt", departmentName: "Production & Creative", title: "Finalize presentation deck & spatial branding assets", assignee: "Dina Kartika", priority: "urgent", status: "in_progress", dueDate: "Day 4" },
  { id: "tsk-3", departmentId: "cat-ops", departmentName: "Operations & Logistics", title: "Prep attendee catering & refreshment station", assignee: "Sarah Lin", priority: "medium", status: "todo", dueDate: "Day 5" },
  { id: "tsk-4", departmentId: "cat-crt", departmentName: "Production & Creative", title: "Audio-visual display calibration and network test", assignee: "Budi Santoso", priority: "high", status: "in_progress", dueDate: "Day 4" },
  { id: "tsk-5", departmentId: "cat-vnd", departmentName: "Vendors & External Services", title: "Confirm vendor contract for staging and power backup", assignee: "Leo Hardi", priority: "urgent", status: "todo", dueDate: "Day 4" },
];

const INITIAL_CALLSHEET: DailyCallSheet = {
  id: "cs-day-4",
  dayNumber: 4,
  totalDays: 16,
  date: "Wednesday, October 14",
  callTime: "06:00 AM",
  estimatedWrap: "19:30 PM",
  locationName: "Cove Harbor Dock 4 & Old Warehouse",
  locationAddress: "Pier 14, Marina Coastline Blvd, Sector B",
  weather: "Overcast / 24°C, Low Tide at 14:00, 30% evening drizzle",
  scenesScheduled: "Keynote Hall A (Morning), Workshop Lab 2 (Afternoon), Partner Showcase (Evening)",
  emergencyContact: "Medic: Dr. Aris (+62 812-3344-5566) / Production Coordinator: +62 811-9988-77",
  directorNotes: "Stage 2 audio rig needs live mic check before 16:30. Ensure backup streaming link active.",
};

const INITIAL_EQUIPMENT: EquipmentRental[] = [
  { id: "eq-1", itemName: "High-Lumen Laser Projector & Screen Kit", vendor: "AVTech Pro Indo", department: "Production & Creative", dailyRate: 1200, returnDate: "Oct 28", daysRemaining: 14, status: "on_set" },
  { id: "eq-2", itemName: "Concert Digital Sound Console & Mic Array", vendor: "AVTech Pro Indo", department: "Production & Creative", dailyRate: 850, returnDate: "Oct 28", daysRemaining: 14, status: "on_set" },
  { id: "eq-3", itemName: "50kW Super-Silent Site Backup Generator", vendor: "PowerGrid Indo", department: "Operations & Logistics", dailyRate: 400, returnDate: "Oct 20", daysRemaining: 6, status: "on_set" },
  { id: "eq-4", itemName: "Modular Aluminium Staging & Truss Rig", vendor: "EventWorks", department: "Vendors & External Services", dailyRate: 1500, returnDate: "Oct 16", daysRemaining: 2, status: "rented" },
];

const INITIAL_ALERTS: SystemAlert[] = [
  { id: "alt-1", type: "overspend", severity: "warning", title: "Production & Creative Approaching Budget Limit", message: "Production & Creative has consumed 74.8% ($33,650 / $45,000) of its total allocation with 12 project days remaining.", timestamp: "2 hours ago", isResolved: false },
  { id: "alt-2", type: "missing_receipt", severity: "critical", title: "Missing Photo on Transaction TX-105", message: "Expense 'Vintage Rotary Telephone ($320)' was logged without an attached receipt file.", timestamp: "Yesterday", isResolved: false },
  { id: "alt-3", type: "daily_reconcile", severity: "info", title: "Daily Reconcile Window Approaching", message: "Day 4 wraps at 19:30 PM. Field lead is requested to verify today's cash count with Project Coordinator.", timestamp: "1 hour ago", isResolved: false },
];

const INITIAL_COMMENTS: ContextComment[] = [
  { id: "c-1", entityId: "TX-102", author: "Devon Reed", authorRole: "UPM", message: "Verified pax count with catering coordinator. Approved.", timestamp: "Today, 18:20" },
  { id: "c-2", entityId: "TX-105", author: "Markus Vance", authorRole: "Producer", message: "Please ask antique vendor for written statement with tax ID tomorrow.", timestamp: "Today, 09:10" },
];

const INITIAL_RECONCILIATIONS: DailyReconcile[] = [
  {
    id: "rec-day-3",
    dayNumber: 3,
    date: "Tuesday, October 13",
    status: "signed_off",
    entries: [
      { pocketId: "pkt-upm", pocketName: "UPM Field Cash", systemBalance: 9200, physicalCount: 9200, discrepancy: 0, custodian: "Devon Reed (UPM)", notes: "" },
      { pocketId: "pkt-transport", pocketName: "Unit Transport Float", systemBalance: 2100, physicalCount: 2100, discrepancy: 0, custodian: "Rizal Pratama", notes: "" },
    ],
    totalSystemBalance: 11300,
    totalPhysicalCount: 11300,
    totalDiscrepancy: 0,
    reconciledBy: "Devon Reed (UPM)",
    signedOffBy: "Elena Rostova (LP)",
    signedOffAt: "Day 3, 20:15",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ─── Storage Key Helper (Namespaced Context) ──────────────────────────────────
export const getProjectStorageKey = (projectId: string, slice: string) =>
  `closebook_${projectId}_${slice}`;

export function useClosebookStore() {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const activeProjectIdRef = useRef<string>(INITIAL_PROJECT.id);

  useEffect(() => {
    activeProjectIdRef.current = project.id;
  }, [project.id]);

  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [pockets, setPockets] = useState<Pocket[]>(INITIAL_POCKETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [transfers, setTransfers] = useState<PocketTransfer[]>(INITIAL_TRANSFERS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [callSheet, setCallSheet] = useState<DailyCallSheet>(INITIAL_CALLSHEET);
  const [equipment, setEquipment] = useState<EquipmentRental[]>(INITIAL_EQUIPMENT);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [comments, setComments] = useState<ContextComment[]>(INITIAL_COMMENTS);
  const [reconciliations, setReconciliations] = useState<DailyReconcile[]>(INITIAL_RECONCILIATIONS);
  const [projects, setProjects] = useState<ProjectShell[]>([
    {
      id: "proj-001",
      name: "Feature Film: 'The Quiet Horizon'",
      slug: "the-quiet-horizon",
      totalBudget: 120000,
      shootDays: 16,
      startDate: "October 11, 2026",
      director: "Alex Mercer",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [isWebhookSyncEnabled, setIsWebhookSyncEnabled] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage (with One-Time Idempotent Migration & Project Scoping)
  useEffect(() => {
    try {
      const MIGRATION_FLAG = "closebook_migration_v2_done";
      const isMigrated = localStorage.getItem(MIGRATION_FLAG) === "true";

      const legacyMap = [
        { legacy: "closebook_tx", slice: "tx" },
        { legacy: "closebook_pockets", slice: "pockets" },
        { legacy: "closebook_transfers", slice: "transfers" },
        { legacy: "closebook_tasks", slice: "tasks" },
        { legacy: "closebook_depts", slice: "depts" },
        { legacy: "closebook_callsheet", slice: "callsheet" },
        { legacy: "closebook_equipment", slice: "equipment" },
        { legacy: "closebook_alerts", slice: "alerts" },
        { legacy: "closebook_comments", slice: "comments" },
        { legacy: "closebook_reconciliations", slice: "reconciliations" },
        { legacy: "closebook_notes", slice: "notes" },
      ];

      // One-time idempotent migration: only runs once, guarded by MIGRATION_FLAG
      // Pre-existing legacy keys are left intact as safety net / fallback backup
      if (!isMigrated) {
        for (const { legacy, slice } of legacyMap) {
          const legacyVal = localStorage.getItem(legacy);
          const targetKey = getProjectStorageKey("proj-001", slice);
          if (legacyVal && !localStorage.getItem(targetKey)) {
            localStorage.setItem(targetKey, legacyVal);
          }
        }
        localStorage.setItem(MIGRATION_FLAG, "true");
      }

      // Load Projects and identify active project
      const savedProjects = localStorage.getItem("closebook_projects");
      let activeId = "proj-001";
      if (savedProjects) {
        try {
          const parsedProjects: ProjectShell[] = JSON.parse(savedProjects);
          if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            setProjects(parsedProjects);
            const active = parsedProjects.find((p) => p.isActive) || parsedProjects[0];
            activeId = active.id;
            setProject((prev) => ({
              ...prev,
              id: active.id,
              name: active.name,
              slug: active.slug,
              totalBudget: active.totalBudget,
              shootDays: active.shootDays,
              startDate: active.startDate,
              director: active.director,
            }));
          }
        } catch {}
      }
      activeProjectIdRef.current = activeId;

      // Helper to load slice with fallback hierarchy (Scoped -> Legacy for proj-001 -> Initial)
      const loadSlice = <T>(slice: string, legacyKey: string, fallback: T): T => {
        const scopedKey = getProjectStorageKey(activeId, slice);
        const scopedVal = localStorage.getItem(scopedKey);
        if (scopedVal) {
          try { return JSON.parse(scopedVal); } catch {}
        }
        if (activeId === "proj-001") {
          const legacyVal = localStorage.getItem(legacyKey);
          if (legacyVal) {
            try { return JSON.parse(legacyVal); } catch {}
          }
        }
        return fallback;
      };

      setTransactions(loadSlice("tx", "closebook_tx", INITIAL_TRANSACTIONS));
      setPockets(loadSlice("pockets", "closebook_pockets", INITIAL_POCKETS));
      setTransfers(loadSlice("transfers", "closebook_transfers", INITIAL_TRANSFERS));
      setTasks(loadSlice("tasks", "closebook_tasks", INITIAL_TASKS));
      setDepartments(loadSlice("depts", "closebook_depts", INITIAL_DEPARTMENTS));
      setCallSheet(loadSlice("callsheet", "closebook_callsheet", INITIAL_CALLSHEET));
      setEquipment(loadSlice("equipment", "closebook_equipment", INITIAL_EQUIPMENT));
      setAlerts(loadSlice("alerts", "closebook_alerts", INITIAL_ALERTS));
      setComments(loadSlice("comments", "closebook_comments", INITIAL_COMMENTS));
      setReconciliations(loadSlice("reconciliations", "closebook_reconciliations", INITIAL_RECONCILIATIONS));
      setNotes(loadSlice("notes", "closebook_notes", []));

      const savedWebhook = localStorage.getItem("closebook_webhook_url");
      if (savedWebhook) setWebhookUrl(savedWebhook);
      const savedSync = localStorage.getItem("closebook_webhook_sync");
      if (savedSync) setIsWebhookSyncEnabled(savedSync === "true");
    } catch {
      // fallback to initial
    }
    setIsLoaded(true);
  }, []);

  // ─── Persist Helpers (Project-Scoped) ───────────────────────────────────────
  const getActivePid = () => activeProjectIdRef.current || project.id || "proj-001";

  const persistTransactions = (newTx: Transaction[]) => {
    setTransactions(newTx);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "tx"), JSON.stringify(newTx)); } catch {}
  };

  const persistPockets = (newPockets: Pocket[]) => {
    setPockets(newPockets);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "pockets"), JSON.stringify(newPockets)); } catch {}
  };

  const persistTransfers = (newTransfers: PocketTransfer[]) => {
    setTransfers(newTransfers);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "transfers"), JSON.stringify(newTransfers)); } catch {}
  };

  const persistTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "tasks"), JSON.stringify(newTasks)); } catch {}
  };

  const persistDepartments = (newDepts: Department[]) => {
    setDepartments(newDepts);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "depts"), JSON.stringify(newDepts)); } catch {}
  };

  const persistCallSheet = (newCallSheet: DailyCallSheet) => {
    setCallSheet(newCallSheet);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "callsheet"), JSON.stringify(newCallSheet)); } catch {}
  };

  const persistEquipment = (newEquipment: EquipmentRental[]) => {
    setEquipment(newEquipment);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "equipment"), JSON.stringify(newEquipment)); } catch {}
  };

  const persistAlerts = (newAlerts: SystemAlert[]) => {
    setAlerts(newAlerts);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "alerts"), JSON.stringify(newAlerts)); } catch {}
  };

  const persistComments = (newComments: ContextComment[]) => {
    setComments(newComments);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "comments"), JSON.stringify(newComments)); } catch {}
  };

  const persistReconciliations = (newRecs: DailyReconcile[]) => {
    setReconciliations(newRecs);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "reconciliations"), JSON.stringify(newRecs)); } catch {}
  };

  const persistProjects = (newProjects: ProjectShell[]) => {
    setProjects(newProjects);
    try { localStorage.setItem("closebook_projects", JSON.stringify(newProjects)); } catch {}
  };

  const persistNotes = (newNotes: ProjectNote[]) => {
    setNotes(newNotes);
    try { localStorage.setItem(getProjectStorageKey(getActivePid(), "notes"), JSON.stringify(newNotes)); } catch {}
  };

  // ─── 1. Transactions ────────────────────────────────────────────────────────
  const addTransaction = (data: {
    description: string;
    amount: number;
    departmentId: string;
    pocketId: string;
    vendor: string;
    receiptUrl?: string;
    isMissingReceipt?: boolean;
    notes?: string;
  }) => {
    if (data.amount <= 0 || isNaN(data.amount)) return null;

    const targetDept = departments.find((d) => d.id === data.departmentId);
    const targetPocket = pockets.find((p) => p.id === data.pocketId);
    const initialStatus = data.isMissingReceipt ? "pending" : "approved";

    const newTx: Transaction = {
      id: `TX-${Math.floor(106 + Math.random() * 893)}`,
      pocketId: data.pocketId,
      pocketName: targetPocket ? targetPocket.name : "Field Cash",
      departmentId: data.departmentId,
      departmentName: targetDept ? targetDept.name : "General",
      amount: data.amount,
      description: data.description,
      vendor: data.vendor || "Direct Vendor",
      status: initialStatus,
      loggedBy: "Field Unit PWA",
      loggedAt: "Just now",
      createdAt: new Date().toISOString(),
      receiptUrl: data.receiptUrl || "/icon.png",
      isMissingReceipt: data.isMissingReceipt || false,
      notes: data.notes || (data.isMissingReceipt ? "Auto-flagged: Missing physical receipt slip." : undefined),
    };

    const updatedPockets = pockets.map((p) =>
      p.id === data.pocketId ? { ...p, balance: Math.max(0, p.balance - data.amount) } : p
    );
    const updatedDepts = departments.map((d) =>
      d.id === data.departmentId ? { ...d, spentAmount: d.spentAmount + data.amount } : d
    );

    const nextTx = [newTx, ...transactions];
    persistDepartments(updatedDepts);
    persistPockets(updatedPockets);
    persistTransactions(nextTx);
    reevaluateAlerts({
      overrideTransactions: nextTx,
      overrideDepts: updatedDepts,
      overridePockets: updatedPockets,
    });

    if (isWebhookSyncEnabled && webhookUrl) {
      try {
        fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "NEW_TRANSACTION",
            projectName: project.name,
            transaction: newTx,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {}
    }

    return newTx;
  };

  const updateTransactionStatus = (id: string, newStatus: "approved" | "rejected") => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx || tx.status === newStatus) return;

    let updatedPockets = [...pockets];
    let updatedDepts = [...departments];

    if (newStatus === "rejected" && tx.status !== "rejected") {
      updatedPockets = updatedPockets.map((p) =>
        p.id === tx.pocketId ? { ...p, balance: p.balance + tx.amount } : p
      );
      updatedDepts = updatedDepts.map((d) =>
        d.id === tx.departmentId ? { ...d, spentAmount: Math.max(0, d.spentAmount - tx.amount) } : d
      );
    }

    if (tx.status === "rejected" && newStatus === "approved") {
      updatedPockets = updatedPockets.map((p) =>
        p.id === tx.pocketId ? { ...p, balance: Math.max(0, p.balance - tx.amount) } : p
      );
      updatedDepts = updatedDepts.map((d) =>
        d.id === tx.departmentId ? { ...d, spentAmount: d.spentAmount + tx.amount } : d
      );
    }

    persistPockets(updatedPockets);
    persistDepartments(updatedDepts);
    const nextTx = transactions.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
    persistTransactions(nextTx);
    reevaluateAlerts({
      overrideTransactions: nextTx,
      overrideDepts: updatedDepts,
      overridePockets: updatedPockets,
    });
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    let updatedPockets = pockets;
    let updatedDepts = departments;
    if (tx.status !== "rejected") {
      updatedPockets = pockets.map((p) => (p.id === tx.pocketId ? { ...p, balance: p.balance + tx.amount } : p));
      updatedDepts = departments.map((d) =>
        d.id === tx.departmentId ? { ...d, spentAmount: Math.max(0, d.spentAmount - tx.amount) } : d
      );
      persistPockets(updatedPockets);
      persistDepartments(updatedDepts);
    }
    const nextTx = transactions.filter((t) => t.id !== id);
    persistTransactions(nextTx);
    reevaluateAlerts({
      overrideTransactions: nextTx,
      overrideDepts: updatedDepts,
      overridePockets: updatedPockets,
    });
  };

  // ─── 2. Transfers ───────────────────────────────────────────────────────────
  const transferFunds = (
    sourcePocketId: string,
    destPocketId: string,
    amount: number,
    notes?: string
  ): { success: boolean; error?: string } => {
    if (sourcePocketId === destPocketId)
      return { success: false, error: "Source and destination pockets cannot be identical." };
    if (amount <= 0 || isNaN(amount))
      return { success: false, error: "Transfer amount must be a positive numeric value." };

    const sourcePocket = pockets.find((p) => p.id === sourcePocketId);
    const destPocket = pockets.find((p) => p.id === destPocketId);

    if (!sourcePocket || !destPocket)
      return { success: false, error: "Invalid pocket selection." };
    if (sourcePocket.balance < amount)
      return {
        success: false,
        error: `Insufficient liquid balance in ${sourcePocket.name}. Available: $${sourcePocket.balance.toLocaleString()}, Requested: $${amount.toLocaleString()}`,
      };

    const updatedPockets = pockets.map((p) => {
      if (p.id === sourcePocketId) return { ...p, balance: p.balance - amount };
      if (p.id === destPocketId) return { ...p, balance: p.balance + amount };
      return p;
    });

    const newTransfer: PocketTransfer = {
      id: `TR-${Math.floor(100 + Math.random() * 899)}`,
      sourcePocketId,
      sourcePocketName: sourcePocket.name,
      destPocketId,
      destPocketName: destPocket.name,
      amount,
      authorizedBy: "Elena Rostova (LP)",
      timestamp: "Just now",
      notes: notes || "Operational fund disbursement",
    };

    persistPockets(updatedPockets);
    persistTransfers([newTransfer, ...transfers]);
    reevaluateAlerts({ overridePockets: updatedPockets });
    return { success: true };
  };

  // ─── 3. Tasks ───────────────────────────────────────────────────────────────
  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const nextStatus: TaskStatus = t.status === "todo" ? "in_progress" : t.status === "in_progress" ? "completed" : "todo";
      return { ...t, status: nextStatus };
    });
    persistTasks(updated);
    reevaluateAlerts({ overrideTasks: updated });
  };

  const addTask = (task: Omit<Task, "id">) => {
    const updated = [...tasks, { id: `tsk-${Date.now()}`, ...task }];
    persistTasks(updated);
    reevaluateAlerts({ overrideTasks: updated });
  };

  const deleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    persistTasks(updated);
    reevaluateAlerts({ overrideTasks: updated });
  };

  // ─── 3b. Categories (Departments) ──────────────────────────────────────────
  const addDepartment = (dept: Omit<Department, "id" | "spentAmount">) => {
    const id = `cat-${Date.now().toString().slice(-4)}`;
    const newDept: Department = {
      id,
      spentAmount: 0,
      ...dept,
    };
    persistDepartments([...departments, newDept]);
    return newDept;
  };

  const updateDepartment = (id: string, updates: Partial<Omit<Department, "id">>) => {
    const updated = departments.map((d) => (d.id === id ? { ...d, ...updates } : d));
    persistDepartments(updated);
  };

  const deleteDepartment = (id: string) => {
    // Prevent deletion if transactions exist for this category
    const hasTx = transactions.some((t) => t.departmentId === id);
    if (hasTx) {
      return { success: false, error: "Cannot delete category with associated transactions" };
    }
    persistDepartments(departments.filter((d) => d.id !== id));
    return { success: true };
  };

  // ─── 4. Call Sheet ──────────────────────────────────────────────────────────
  const updateCallSheet = (updates: Partial<DailyCallSheet>) => {
    persistCallSheet({ ...callSheet, ...updates });
  };

  const advanceShootDay = () => {
    if (callSheet.dayNumber < callSheet.totalDays) {
      const nextDay = callSheet.dayNumber + 1;
      const updatedCs: DailyCallSheet = {
        ...callSheet,
        dayNumber: nextDay,
        date: `Production Day ${nextDay} of ${callSheet.totalDays}`,
        scenesScheduled: `Scene ${nextDay * 3} & Scene ${nextDay * 3 + 1} (Scheduled for Day ${nextDay})`,
      };
      persistCallSheet(updatedCs);
      reevaluateAlerts({ overrideCallSheet: updatedCs });
    }
  };

  // ─── 5. Equipment ───────────────────────────────────────────────────────────
  const addEquipment = (item: Omit<EquipmentRental, "id">) => {
    persistEquipment([...equipment, { id: `eq-${Date.now().toString().slice(-4)}`, ...item }]);
  };

  const updateEquipmentStatus = (id: string, status: EquipmentStatus) => {
    persistEquipment(equipment.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  const deleteEquipment = (id: string) => {
    persistEquipment(equipment.filter((e) => e.id !== id));
  };

  // ─── 6. Centralized Alerts & Evaluator Engine ───────────────────────────────
  const reevaluateAlerts = (overrides?: {
    overrideTasks?: Task[];
    overrideCallSheet?: DailyCallSheet;
    overrideDepts?: Department[];
    overrideTransactions?: Transaction[];
    overridePockets?: Pocket[];
    baseAlerts?: SystemAlert[];
  }): SystemAlert[] => {
    const currentTasks = overrides?.overrideTasks ?? tasks;
    const currentCs = overrides?.overrideCallSheet ?? callSheet;
    const currentDepts = overrides?.overrideDepts ?? departments;
    const currentTx = overrides?.overrideTransactions ?? transactions;
    const currentPockets = overrides?.overridePockets ?? pockets;
    let nextAlerts = overrides?.baseAlerts ? [...overrides.baseAlerts] : [...alerts];

    // Helper: upsert alert or auto-resolve if no longer active
    const upsertAlert = (alertData: Omit<SystemAlert, "timestamp"> & { timestamp?: string }) => {
      const existingIdx = nextAlerts.findIndex((a) => a.id === alertData.id);
      if (existingIdx >= 0) {
        // Update in-place to prevent duplication
        nextAlerts[existingIdx] = {
          ...nextAlerts[existingIdx],
          ...alertData,
          timestamp: nextAlerts[existingIdx].timestamp || "Just now",
        };
      } else {
        nextAlerts.unshift({
          ...alertData,
          timestamp: alertData.timestamp || "Just now",
        });
      }
    };

    const autoResolveAlert = (alertId: string) => {
      const existingIdx = nextAlerts.findIndex((a) => a.id === alertId);
      if (existingIdx >= 0 && !nextAlerts[existingIdx].isResolved) {
        nextAlerts[existingIdx] = {
          ...nextAlerts[existingIdx],
          isResolved: true,
        };
      }
    };

    // Rule 1: OVERDUE_TASK
    // Check all tasks with due dates formatted as "Day X"
    currentTasks.forEach((task) => {
      const alertId = `alt-task-${task.id}`;
      if (task.status === "completed") {
        autoResolveAlert(alertId);
        return;
      }

      const match = task.dueDate.match(/Day\s*(\d+)/i);
      if (match) {
        const taskDueDay = parseInt(match[1], 10);
        const dayDiff = currentCs.dayNumber - taskDueDay;

        if (dayDiff > 0) {
          const isCritical = dayDiff >= 2;
          const severity: AlertSeverity = isCritical ? "critical" : "warning";
          const title = isCritical
            ? `Critical Overdue: ${task.title}`
            : `Task Overdue: ${task.title}`;
          const message = isCritical
            ? `Task '${task.title}' assigned to ${task.assignee} is ${dayDiff} days past deadline (due Day ${taskDueDay}). Immediate escalation required.`
            : `Task '${task.title}' assigned to ${task.assignee} was due on Day ${taskDueDay} (1 day overdue).`;

          upsertAlert({
            id: alertId,
            type: "overdue_task",
            severity,
            title,
            message,
            isResolved: false,
            entityId: task.id,
          });
        } else {
          autoResolveAlert(alertId);
        }
      }
    });

    // Rule 2: OVERSPEND_WARN per category
    currentDepts.forEach((dept) => {
      const alertId = `alt-over-${dept.id}`;
      if (dept.allocatedBudget > 0) {
        const pct = (dept.spentAmount / dept.allocatedBudget) * 100;
        if (pct >= 90) {
          const severity: AlertSeverity = pct >= 100 ? "critical" : "warning";
          upsertAlert({
            id: alertId,
            type: "overspend",
            severity,
            title: `${dept.name} Approaching Budget Cap`,
            message: `${dept.name} has consumed ${pct.toFixed(1)}% of its allocated budget ($${dept.spentAmount.toLocaleString()} / $${dept.allocatedBudget.toLocaleString()}).`,
            isResolved: false,
            entityId: dept.id,
          });
        } else {
          autoResolveAlert(alertId);
        }
      }
    });

    // Rule 3: MISSING_RECEIPT per transaction
    currentTx.forEach((tx) => {
      const alertId = `alt-rec-${tx.id}`;
      if (tx.isMissingReceipt && tx.status !== "rejected") {
        upsertAlert({
          id: alertId,
          type: "missing_receipt",
          severity: "critical",
          title: `Missing Receipt on ${tx.id}`,
          message: `Expense '${tx.description}' ($${tx.amount.toFixed(2)}) recorded without receipt image. Auditor verification required.`,
          isResolved: false,
          entityId: tx.id,
        });
      } else {
        autoResolveAlert(alertId);
      }
    });

    // Rule 4: LOW_BALANCE per pocket
    currentPockets.forEach((p) => {
      const alertId = `alt-bal-${p.id}`;
      if (p.allocated > 0 && p.balance / p.allocated < 0.15) {
        upsertAlert({
          id: alertId,
          type: "low_balance",
          severity: "warning",
          title: `Low Balance Warning on ${p.name}`,
          message: `${p.name} liquid balance is now down to $${p.balance.toLocaleString()} (<15% allocation).`,
          isResolved: false,
          entityId: p.id,
        });
      } else {
        autoResolveAlert(alertId);
      }
    });

    // Rule 5: Clean up alerts for deleted transactions/tasks/pockets
    nextAlerts.forEach((a) => {
      if (a.type === "overdue_task" && a.entityId) {
        const exists = currentTasks.some((t) => t.id === a.entityId);
        if (!exists) a.isResolved = true;
      }
      if (a.type === "missing_receipt" && a.entityId) {
        const exists = currentTx.some((t) => t.id === a.entityId);
        if (!exists) a.isResolved = true;
      }
      if (a.type === "low_balance" && a.entityId) {
        const exists = currentPockets.some((p) => p.id === a.entityId);
        if (!exists) a.isResolved = true;
      }
    });

    persistAlerts(nextAlerts);
    return nextAlerts;
  };

  const resolveAlert = (alertId: string) => {
    persistAlerts(alerts.map((a) => (a.id === alertId ? { ...a, isResolved: true } : a)));
  };

  // ─── 7. Comments ────────────────────────────────────────────────────────────
  const addComment = (entityId: string, author: string, message: string) => {
    persistComments([...comments, {
      id: `c-${Date.now()}`,
      entityId,
      author,
      authorRole: "Crew",
      message,
      timestamp: "Just now",
    }]);
  };

  // ─── 8. Daily Reconciliation ────────────────────────────────────────────────
  /**
   * Submit an end-of-day cash reconciliation.
   * @param physicalCounts - Map of pocketId → physical cash count (in USD)
   * @param reconciledBy - Name of UPM/person performing the count
   */
  const reconcileDay = (
    physicalCounts: Record<string, number>,
    reconciledBy: string
  ): DailyReconcile => {
    const fieldPockets = pockets.filter((p) => p.type !== "master_vault");
    const entries: ReconcileEntry[] = fieldPockets.map((p) => {
      const physical = physicalCounts[p.id] ?? p.balance;
      const discrepancy = physical - p.balance;
      return {
        pocketId: p.id,
        pocketName: p.name,
        systemBalance: p.balance,
        physicalCount: physical,
        discrepancy,
        custodian: p.custodian,
        notes: "",
      };
    });

    const totalSystem = entries.reduce((a, e) => a + e.systemBalance, 0);
    const totalPhysical = entries.reduce((a, e) => a + e.physicalCount, 0);
    const totalDiscrepancy = totalPhysical - totalSystem;

    const status = entries.every((e) => e.discrepancy === 0) ? "balanced" : "discrepancy";

    const newRec: DailyReconcile = {
      id: `rec-day-${callSheet.dayNumber}-${Date.now()}`,
      dayNumber: callSheet.dayNumber,
      date: callSheet.date,
      status,
      entries,
      totalSystemBalance: totalSystem,
      totalPhysicalCount: totalPhysical,
      totalDiscrepancy,
      reconciledBy,
      createdAt: new Date().toISOString(),
    };

    persistReconciliations([newRec, ...reconciliations]);

    // If there's a discrepancy, raise an alert
    if (totalDiscrepancy !== 0) {
      const discAlert: SystemAlert = {
        id: `alt-rec-${Date.now()}`,
        type: "daily_reconcile",
        severity: Math.abs(totalDiscrepancy) > 100 ? "critical" : "warning",
        title: `Day ${callSheet.dayNumber} Reconciliation: Cash Discrepancy`,
        message: `A discrepancy of $${Math.abs(totalDiscrepancy).toFixed(2)} was found during end-of-day cash count. Immediate review required.`,
        timestamp: "Just now",
        isResolved: false,
      };
      persistAlerts([discAlert, ...alerts]);
    }

    return newRec;
  };

  const signOffReconciliation = (recId: string, signedOffBy: string) => {
    persistReconciliations(reconciliations.map((r) =>
      r.id === recId
        ? { ...r, status: "signed_off", signedOffBy, signedOffAt: `Day ${r.dayNumber}, ${new Date().toLocaleTimeString()}` }
        : r
    ));
  };

  // ─── 9. Project Notes ────────────────────────────────────────────────────────
  const addNote = (content: string, author: string, category?: NoteCategory): ProjectNote => {
    const newNote: ProjectNote = {
      id: `note-${Date.now()}`,
      author: author || "Current User",
      content: content.trim(),
      category,
      createdAt: new Date().toISOString(),
      isPinned: false,
    };
    persistNotes([newNote, ...notes]);
    return newNote;
  };

  const togglePinNote = (noteId: string): void => {
    persistNotes(notes.map((n) => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
  };

  const deleteNote = (noteId: string): void => {
    persistNotes(notes.filter((n) => n.id !== noteId));
  };

  // ─── 10. Multi-Project ───────────────────────────────────────────────────────
  const createProject = (name: string, totalBudget: number, shootDays: number, director: string) => {
    const id = `proj-${Date.now()}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newShell: ProjectShell = {
      id,
      name,
      slug,
      totalBudget,
      shootDays,
      startDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      director,
      createdAt: new Date().toISOString(),
      isActive: false,
    };

    // Initialize sensible fresh defaults for the new project
    const defaultDepts: Department[] = [
      { id: `dept-${id}-1`, name: "Camera & Lighting", code: "CAM", allocatedBudget: Math.round(totalBudget * 0.35), spentAmount: 0, color: "#3b82f6" },
      { id: `dept-${id}-2`, name: "Art & Production Design", code: "ART", allocatedBudget: Math.round(totalBudget * 0.25), spentAmount: 0, color: "#10b981" },
      { id: `dept-${id}-3`, name: "Catering & Craft Services", code: "CAT", allocatedBudget: Math.round(totalBudget * 0.15), spentAmount: 0, color: "#f59e0b" },
      { id: `dept-${id}-4`, name: "Sound & Post-Audio", code: "SND", allocatedBudget: Math.round(totalBudget * 0.15), spentAmount: 0, color: "#8b5cf6" },
      { id: `dept-${id}-5`, name: "Locations & Logistics", code: "LOC", allocatedBudget: Math.round(totalBudget * 0.10), spentAmount: 0, color: "#ec4899" },
    ];
    const defaultPockets: Pocket[] = [
      { id: `poc-${id}-1`, name: "Production Petty Cash", type: "operational_pocket", custodian: "Devon Reed (UPM)", balance: Math.round(totalBudget * 0.1), allocated: Math.round(totalBudget * 0.1) },
      { id: `poc-${id}-2`, name: "Locations Emergency Cash", type: "field_cash", custodian: "Maya Lin (Location Mgr)", balance: Math.round(totalBudget * 0.05), allocated: Math.round(totalBudget * 0.05) },
      { id: `poc-${id}-3`, name: "Master Production Vault", type: "master_vault", custodian: "Elena Rostova (LP)", balance: Math.round(totalBudget * 0.85), allocated: Math.round(totalBudget * 0.85) },
    ];
    const defaultCallSheet: DailyCallSheet = {
      id: `cs-${id}-1`,
      dayNumber: 1,
      totalDays: shootDays,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      callTime: "07:00 AM",
      estimatedWrap: "19:00 PM",
      locationName: "Main Production Location",
      locationAddress: "Studio A, Production Base",
      weather: "Clear / 25°C",
      scenesScheduled: "Day 1 Principal Photography Setup & Key Scenes",
      emergencyContact: "Production Office: (555) 019-2834",
      directorNotes: `Welcome to Day 1 of ${name}! Safety briefing at call time.`,
    };

    try {
      localStorage.setItem(getProjectStorageKey(id, "depts"), JSON.stringify(defaultDepts));
      localStorage.setItem(getProjectStorageKey(id, "pockets"), JSON.stringify(defaultPockets));
      localStorage.setItem(getProjectStorageKey(id, "callsheet"), JSON.stringify(defaultCallSheet));
      localStorage.setItem(getProjectStorageKey(id, "tx"), JSON.stringify([]));
      localStorage.setItem(getProjectStorageKey(id, "transfers"), JSON.stringify([]));
      localStorage.setItem(getProjectStorageKey(id, "tasks"), JSON.stringify([]));
      localStorage.setItem(getProjectStorageKey(id, "equipment"), JSON.stringify([]));
      localStorage.setItem(getProjectStorageKey(id, "alerts"), JSON.stringify([]));
      localStorage.setItem(getProjectStorageKey(id, "comments"), JSON.stringify([]));
      localStorage.setItem(getProjectStorageKey(id, "reconciliations"), JSON.stringify([]));
      localStorage.setItem(getProjectStorageKey(id, "notes"), JSON.stringify([]));
    } catch {}

    persistProjects([...projects, newShell]);
    return id;
  };

  const switchProject = (targetProjectId: string) => {
    if (targetProjectId === project.id) return;
    const targetShell = projects.find((p) => p.id === targetProjectId);
    if (!targetShell) return;

    // 1. Flush/save current in-memory state to current active project storage keys
    const curId = activeProjectIdRef.current || project.id;
    try {
      localStorage.setItem(getProjectStorageKey(curId, "tx"), JSON.stringify(transactions));
      localStorage.setItem(getProjectStorageKey(curId, "pockets"), JSON.stringify(pockets));
      localStorage.setItem(getProjectStorageKey(curId, "transfers"), JSON.stringify(transfers));
      localStorage.setItem(getProjectStorageKey(curId, "tasks"), JSON.stringify(tasks));
      localStorage.setItem(getProjectStorageKey(curId, "depts"), JSON.stringify(departments));
      localStorage.setItem(getProjectStorageKey(curId, "callsheet"), JSON.stringify(callSheet));
      localStorage.setItem(getProjectStorageKey(curId, "equipment"), JSON.stringify(equipment));
      localStorage.setItem(getProjectStorageKey(curId, "alerts"), JSON.stringify(alerts));
      localStorage.setItem(getProjectStorageKey(curId, "comments"), JSON.stringify(comments));
      localStorage.setItem(getProjectStorageKey(curId, "reconciliations"), JSON.stringify(reconciliations));
      localStorage.setItem(getProjectStorageKey(curId, "notes"), JSON.stringify(notes));
    } catch {}

    // 2. Load target project's data from localStorage (or fallback to defaults if proj-001)
    try {
      const loadSlice = <T>(slice: string, fallback: T): T => {
        const item = localStorage.getItem(getProjectStorageKey(targetProjectId, slice));
        if (item) {
          try { return JSON.parse(item); } catch {}
        }
        return fallback;
      };

      setTransactions(loadSlice("tx", targetProjectId === "proj-001" ? INITIAL_TRANSACTIONS : []));
      setPockets(loadSlice("pockets", targetProjectId === "proj-001" ? INITIAL_POCKETS : []));
      setTransfers(loadSlice("transfers", targetProjectId === "proj-001" ? INITIAL_TRANSFERS : []));
      setTasks(loadSlice("tasks", targetProjectId === "proj-001" ? INITIAL_TASKS : []));
      setDepartments(loadSlice("depts", targetProjectId === "proj-001" ? INITIAL_DEPARTMENTS : []));
      setCallSheet(loadSlice("callsheet", targetProjectId === "proj-001" ? INITIAL_CALLSHEET : {
        id: `cs-${targetProjectId}-1`,
        dayNumber: 1,
        totalDays: targetShell.shootDays,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        callTime: "07:00 AM",
        estimatedWrap: "19:00 PM",
        locationName: "Main Production Location",
        locationAddress: "Studio A, Production Base",
        weather: "Clear / 25°C",
        scenesScheduled: "Day 1 Principal Photography Setup & Key Scenes",
        emergencyContact: "Production Office: (555) 019-2834",
        directorNotes: `Day 1 of ${targetShell.name}`,
      }));
      setEquipment(loadSlice("equipment", targetProjectId === "proj-001" ? INITIAL_EQUIPMENT : []));
      setAlerts(loadSlice("alerts", targetProjectId === "proj-001" ? INITIAL_ALERTS : []));
      setComments(loadSlice("comments", targetProjectId === "proj-001" ? INITIAL_COMMENTS : []));
      setReconciliations(loadSlice("reconciliations", targetProjectId === "proj-001" ? INITIAL_RECONCILIATIONS : []));
      setNotes(loadSlice("notes", []));
    } catch {}

    // 3. Mark active in projects list
    const updatedProjects = projects.map((p) => ({ ...p, isActive: p.id === targetProjectId }));
    persistProjects(updatedProjects);

    // 4. Update ref and active project metadata
    activeProjectIdRef.current = targetShell.id;
    setProject({
      id: targetShell.id,
      name: targetShell.name,
      slug: targetShell.slug,
      currency: "USD",
      totalBudget: targetShell.totalBudget,
      currentDisbursed: 0,
      driveFolderId: "",
      sheetId: "",
      shootDays: targetShell.shootDays,
      startDate: targetShell.startDate,
      director: targetShell.director,
      createdAt: targetShell.createdAt,
    });
  };

  const deleteProject = (projectId: string) => {
    if (projects.length <= 1) return false;
    const remaining = projects.filter((p) => p.id !== projectId);
    if (project.id === projectId) {
      const fallback = remaining[0];
      switchProject(fallback.id);
    }
    persistProjects(remaining);
    const slices = ["tx", "pockets", "transfers", "tasks", "depts", "callsheet", "equipment", "alerts", "comments", "reconciliations", "notes"];
    try {
      slices.forEach((s) => localStorage.removeItem(getProjectStorageKey(projectId, s)));
    } catch {}
    return true;
  };

  // ─── 10. BYOS Exports ───────────────────────────────────────────────────────
  const exportLedgerCSV = () => {
    const headers = ["Transaction ID", "Description", "Department", "Pocket", "Vendor", "Amount", "Status", "Date Logged", "Missing Receipt", "Notes"];
    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.departmentName}"`,
      `"${t.pocketName}"`,
      `"${t.vendor.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.status}"`,
      `"${t.loggedAt}"`,
      t.isMissingReceipt ? "YES" : "NO",
      `"${(t.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `closebook_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProductionVaultJSON = () => {
    const vaultData = {
      system: "Closebook Zero-Budget OS",
      exportedAt: new Date().toISOString(),
      project,
      departments,
      pockets,
      transfers,
      transactions,
      tasks,
      callSheet,
      equipment,
      alerts,
      comments,
      reconciliations,
      notes,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vaultData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `closebook_vault_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── 11. Webhook / Google Sheets ────────────────────────────────────────────
  const persistWebhookConfig = (url: string, enabled: boolean) => {
    setWebhookUrl(url);
    setIsWebhookSyncEnabled(enabled);
    try {
      localStorage.setItem("closebook_webhook_url", url);
      localStorage.setItem("closebook_webhook_sync", enabled ? "true" : "false");
    } catch {}
  };

  const syncTransactionToWebhook = async (tx: Transaction): Promise<{ success: boolean; error?: string }> => {
    if (!webhookUrl || !webhookUrl.startsWith("http"))
      return { success: false, error: "No valid Webhook URL configured." };
    try {
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "NEW_TRANSACTION", projectName: project.name, transaction: tx, timestamp: new Date().toISOString() }),
      });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const bulkSyncToWebhook = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!webhookUrl || !webhookUrl.startsWith("http"))
      return { success: false, count: 0, error: "No valid Webhook URL configured." };
    try {
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "BULK_SYNC", projectName: project.name, transactions, timestamp: new Date().toISOString() }),
      });
      return { success: true, count: transactions.length };
    } catch (err: unknown) {
      return { success: false, count: 0, error: err instanceof Error ? err.message : String(err) };
    }
  };

  // ─── 12. Burn Rate Forecast ─────────────────────────────────────────────────
  const getBurnRateForecast = () => {
    const totalSpent = departments.reduce((a, d) => a + d.spentAmount, 0);
    const daysElapsed = Math.max(1, callSheet.dayNumber);
    const daysRemaining = callSheet.totalDays - daysElapsed;
    const dailyBurnRate = totalSpent / daysElapsed;
    const projectedTotal = totalSpent + dailyBurnRate * daysRemaining;
    const projectedOverBudget = projectedTotal > project.totalBudget;
    const daysUntilBudgetExhausted = projectedOverBudget
      ? Math.floor((project.totalBudget - totalSpent) / dailyBurnRate)
      : null;

    return {
      totalSpent,
      dailyBurnRate,
      projectedTotal,
      projectedOverBudget,
      daysUntilBudgetExhausted,
      daysElapsed,
      daysRemaining,
      budgetUtilizationPct: (totalSpent / project.totalBudget) * 100,
    };
  };

  return {
    isLoaded,
    project,
    departments,
    pockets,
    transfers,
    transactions,
    tasks,
    callSheet,
    equipment,
    alerts,
    comments,
    reconciliations,
    notes,
    projects,
    webhookUrl,
    isWebhookSyncEnabled,
    // Transactions
    addTransaction,
    updateTransactionStatus,
    deleteTransaction,
    // Transfers
    transferFunds,
    // Tasks
    toggleTask,
    addTask,
    deleteTask,
    // Categories
    addDepartment,
    updateDepartment,
    deleteDepartment,
    // Call Sheet
    updateCallSheet,
    advanceShootDay,
    // Equipment
    addEquipment,
    updateEquipmentStatus,
    deleteEquipment,
    // Alerts
    resolveAlert,
    reevaluateAlerts,
    // Comments
    addComment,
    // Reconciliation
    reconcileDay,
    signOffReconciliation,
    // Multi-project
    createProject,
    switchProject,
    deleteProject,
    // Webhook
    persistWebhookConfig,
    syncTransactionToWebhook,
    bulkSyncToWebhook,
    // Exports
    exportLedgerCSV,
    exportProductionVaultJSON,
    // Notes
    addNote,
    togglePinNote,
    deleteNote,
    // Computed
    getBurnRateForecast,
  };
}
