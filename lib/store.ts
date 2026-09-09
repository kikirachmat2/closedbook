"use client";

import { useState, useEffect } from "react";
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
  ContextComment,
  PocketTransfer,
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
};

const INITIAL_DEPARTMENTS: Department[] = [
  { id: "dept-cam", name: "Camera & Optical", code: "CAM", allocatedBudget: 28000, spentAmount: 14200, color: "#ff1e42" },
  { id: "dept-art", name: "Art & Production Design", code: "ART", allocatedBudget: 22000, spentAmount: 19450, color: "#f59e0b" },
  { id: "dept-grp", name: "Grip & Electric", code: "G&E", allocatedBudget: 18000, spentAmount: 8200, color: "#3b82f6" },
  { id: "dept-unt", name: "Unit & Logistics", code: "UNT", allocatedBudget: 14000, spentAmount: 6450, color: "#10b981" },
  { id: "dept-cat", name: "Catering & Craft", code: "CAT", allocatedBudget: 12000, spentAmount: 4800, color: "#8b5cf6" },
  { id: "dept-wrd", name: "Wardrobe & HMU", code: "WRD", allocatedBudget: 9000, spentAmount: 3100, color: "#ec4899" },
  { id: "dept-snd", name: "Sound Engineering", code: "SND", allocatedBudget: 8000, spentAmount: 2150, color: "#06b6d4" },
  { id: "dept-ops", name: "Production Office", code: "OPS", allocatedBudget: 9000, spentAmount: 4000, color: "#64748b" },
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
    departmentId: "dept-unt",
    departmentName: "Unit & Logistics",
    amount: 380,
    description: "Diesel Fuel for Location Genset (200L)",
    vendor: "Pertamina Energy Depot",
    status: "approved",
    loggedBy: "Rizal Pratama",
    loggedAt: "Today, 14:20",
    receiptUrl: "/icon.png",
    notes: "Stamped by gas station manager.",
  },
  {
    id: "TX-102",
    pocketId: "pkt-upm",
    pocketName: "UPM Field Cash",
    departmentId: "dept-cat",
    departmentName: "Catering & Craft",
    amount: 640,
    description: "Overtime Hot Dinner for Crew (40 Pax)",
    vendor: "Harbor Bistro Catering",
    status: "pending",
    loggedBy: "Sarah Lin",
    loggedAt: "Today, 18:05",
    receiptUrl: "/icon.png",
    notes: "Ordered due to night scene delay.",
  },
  {
    id: "TX-103",
    pocketId: "pkt-upm",
    pocketName: "UPM Field Cash",
    departmentId: "dept-art",
    departmentName: "Art & Production Design",
    amount: 190,
    description: "Weathered Wallpaper & Acrylic Primer",
    vendor: "ACE Hardware Central",
    status: "approved",
    loggedBy: "Dina Kartika",
    loggedAt: "Yesterday, 11:30",
    receiptUrl: "/icon.png",
  },
  {
    id: "TX-104",
    pocketId: "pkt-lp",
    pocketName: "Line Producer Reserve",
    departmentId: "dept-cam",
    departmentName: "Camera & Optical",
    amount: 450,
    description: "Additional 1TB CFexpress Type B Media",
    vendor: "Prisma Cine Gear Rental",
    status: "approved",
    loggedBy: "Devon Reed",
    loggedAt: "Yesterday, 09:15",
    receiptUrl: "/icon.png",
  },
  {
    id: "TX-105",
    pocketId: "pkt-upm",
    pocketName: "UPM Field Cash",
    departmentId: "dept-art",
    departmentName: "Art & Production Design",
    amount: 320,
    description: "Vintage Rotary Telephone Prop Purchase",
    vendor: "Antique Flea Market",
    status: "pending",
    loggedBy: "Dina Kartika",
    loggedAt: "Yesterday, 16:40",
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
  { id: "tsk-1", departmentId: "dept-unt", departmentName: "Unit & Logistics", title: "Confirm police escort for convoy to coastal cliff", assignee: "Rizal Pratama", priority: "high", status: "completed", dueDate: "Day 4" },
  { id: "tsk-2", departmentId: "dept-art", departmentName: "Art & Production Design", title: "Complete distressing on hero boat cabin props", assignee: "Dina Kartika", priority: "urgent", status: "in_progress", dueDate: "Day 4" },
  { id: "tsk-3", departmentId: "dept-cat", departmentName: "Catering & Craft", title: "Prep midnight warm tea & soup station for rain scenes", assignee: "Sarah Lin", priority: "medium", status: "todo", dueDate: "Day 5" },
  { id: "tsk-4", departmentId: "dept-cam", departmentName: "Camera & Optical", title: "Sensor recalibration and lens rain-cover waterproof check", assignee: "Budi Santoso", priority: "high", status: "in_progress", dueDate: "Day 4" },
  { id: "tsk-5", departmentId: "dept-grp", departmentName: "Grip & Electric", title: "Position 18K HMI backlight towers on crane 2", assignee: "Leo Hardi", priority: "urgent", status: "todo", dueDate: "Day 4" },
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
  scenesScheduled: "Scene 12 (EXT. DOCK - DAY), Scene 14 (INT. CABIN - SUNSET), Scene 15 (EXT. HARBOR - DUSK)",
  emergencyContact: "Medic: Dr. Aris (+62 812-3344-5566) / Production Coordinator: +62 811-9988-77",
  directorNotes: "Scene 14 requires real water reflection on actor's face. Grip check dimmer boards before 16:30.",
};

const INITIAL_EQUIPMENT: EquipmentRental[] = [
  { id: "eq-1", itemName: "ARRI Alexa 35 Camera Package (A-Cam)", vendor: "CamTek Rentals", department: "Camera", dailyRate: 1200, returnDate: "Oct 28", daysRemaining: 14, status: "on_set" },
  { id: "eq-2", itemName: "Cooke Anamorphic /i Prime Lens Set (5 Lenses)", vendor: "CamTek Rentals", department: "Camera", dailyRate: 850, returnDate: "Oct 28", daysRemaining: 14, status: "on_set" },
  { id: "eq-3", itemName: "120kW Super-Silent Trailer Generator", vendor: "GripMaster Indo", department: "Grip & Electric", dailyRate: 400, returnDate: "Oct 20", daysRemaining: 6, status: "on_set" },
  { id: "eq-4", itemName: "Technocrane 30ft Telescopic Jib", vendor: "MotionDynamics", department: "Grip & Electric", dailyRate: 1500, returnDate: "Oct 16", daysRemaining: 2, status: "rented" },
];

const INITIAL_ALERTS: SystemAlert[] = [
  { id: "alt-1", type: "overspend", severity: "warning", title: "Art Department Approaching Budget Limit", message: "Art & Set has consumed 88.4% ($19,450 / $22,000) of its total allocation with 12 shoot days remaining.", timestamp: "2 hours ago", isResolved: false },
  { id: "alt-2", type: "missing_receipt", severity: "critical", title: "Missing Photo on Transaction TX-105", message: "Expense 'Vintage Rotary Telephone ($320)' was logged without an attached receipt file.", timestamp: "Yesterday", isResolved: false },
  { id: "alt-3", type: "daily_reconcile", severity: "info", title: "Daily Reconcile Window Approaching", message: "Day 4 wraps at 19:30 PM. UPM is requested to verify today's cash count with Line Producer.", timestamp: "1 hour ago", isResolved: false },
];

const INITIAL_COMMENTS: ContextComment[] = [
  { id: "c-1", entityId: "TX-102", author: "Devon Reed", authorRole: "UPM", message: "Verified pax count with catering coordinator. Approved.", timestamp: "Today, 18:20" },
  { id: "c-2", entityId: "TX-105", author: "Markus Vance", authorRole: "Producer", message: "Please ask antique vendor for written statement with tax ID tomorrow.", timestamp: "Today, 09:10" },
];

export function useClosebookStore() {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [pockets, setPockets] = useState<Pocket[]>(INITIAL_POCKETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [transfers, setTransfers] = useState<PocketTransfer[]>(INITIAL_TRANSFERS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [callSheet, setCallSheet] = useState<DailyCallSheet>(INITIAL_CALLSHEET);
  const [equipment, setEquipment] = useState<EquipmentRental[]>(INITIAL_EQUIPMENT);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [comments, setComments] = useState<ContextComment[]>(INITIAL_COMMENTS);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [isWebhookSyncEnabled, setIsWebhookSyncEnabled] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedTx = localStorage.getItem("closebook_tx");
      if (savedTx) setTransactions(JSON.parse(savedTx));
      const savedPockets = localStorage.getItem("closebook_pockets");
      if (savedPockets) setPockets(JSON.parse(savedPockets));
      const savedTransfers = localStorage.getItem("closebook_transfers");
      if (savedTransfers) setTransfers(JSON.parse(savedTransfers));
      const savedTasks = localStorage.getItem("closebook_tasks");
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      const savedDepts = localStorage.getItem("closebook_depts");
      if (savedDepts) setDepartments(JSON.parse(savedDepts));
      const savedCallSheet = localStorage.getItem("closebook_callsheet");
      if (savedCallSheet) setCallSheet(JSON.parse(savedCallSheet));
      const savedEquipment = localStorage.getItem("closebook_equipment");
      if (savedEquipment) setEquipment(JSON.parse(savedEquipment));
      const savedAlerts = localStorage.getItem("closebook_alerts");
      if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
      const savedComments = localStorage.getItem("closebook_comments");
      if (savedComments) setComments(JSON.parse(savedComments));
      const savedWebhook = localStorage.getItem("closebook_webhook_url");
      if (savedWebhook) setWebhookUrl(savedWebhook);
      const savedSync = localStorage.getItem("closebook_webhook_sync");
      if (savedSync) setIsWebhookSyncEnabled(savedSync === "true");
    } catch {
      // fallback to initial
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  const persistTransactions = (newTx: Transaction[]) => {
    setTransactions(newTx);
    try {
      localStorage.setItem("closebook_tx", JSON.stringify(newTx));
    } catch {}
  };

  const persistPockets = (newPockets: Pocket[]) => {
    setPockets(newPockets);
    try {
      localStorage.setItem("closebook_pockets", JSON.stringify(newPockets));
    } catch {}
  };

  const persistTransfers = (newTransfers: PocketTransfer[]) => {
    setTransfers(newTransfers);
    try {
      localStorage.setItem("closebook_transfers", JSON.stringify(newTransfers));
    } catch {}
  };

  const persistTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem("closebook_tasks", JSON.stringify(newTasks));
    } catch {}
  };

  const persistDepartments = (newDepts: Department[]) => {
    setDepartments(newDepts);
    try {
      localStorage.setItem("closebook_depts", JSON.stringify(newDepts));
    } catch {}
  };

  const persistCallSheet = (newCallSheet: DailyCallSheet) => {
    setCallSheet(newCallSheet);
    try {
      localStorage.setItem("closebook_callsheet", JSON.stringify(newCallSheet));
    } catch {}
  };

  const persistEquipment = (newEquipment: EquipmentRental[]) => {
    setEquipment(newEquipment);
    try {
      localStorage.setItem("closebook_equipment", JSON.stringify(newEquipment));
    } catch {}
  };

  const persistAlerts = (newAlerts: SystemAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem("closebook_alerts", JSON.stringify(newAlerts));
    } catch {}
  };

  const persistComments = (newComments: ContextComment[]) => {
    setComments(newComments);
    try {
      localStorage.setItem("closebook_comments", JSON.stringify(newComments));
    } catch {}
  };

  // 1. Add Transaction & deduct from pocket
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
    if (data.amount <= 0 || isNaN(data.amount)) {
      return null;
    }

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
      receiptUrl: data.receiptUrl || "/icon.png",
      isMissingReceipt: data.isMissingReceipt || false,
      notes: data.notes || (data.isMissingReceipt ? "Auto-flagged: Missing physical receipt slip." : undefined),
    };

    // Deduct from pocket
    const updatedPockets = pockets.map((p) => {
      if (p.id === data.pocketId) {
        return { ...p, balance: Math.max(0, p.balance - data.amount) };
      }
      return p;
    });

    // Update department spent amount
    const updatedDepts = departments.map((d) => {
      if (d.id === data.departmentId) {
        return { ...d, spentAmount: d.spentAmount + data.amount };
      }
      return d;
    });

    // Dynamic alert trigger 1: Missing Receipt
    let updatedAlerts = [...alerts];
    if (data.isMissingReceipt) {
      const missingAlert: SystemAlert = {
        id: `alt-rec-${Date.now()}`,
        type: "missing_receipt",
        severity: "critical",
        title: `Missing Receipt on ${newTx.id}`,
        message: `Expense '${newTx.description}' ($${data.amount.toFixed(2)}) was recorded without receipt image. Auditor verification required.`,
        timestamp: "Just now",
        isResolved: false,
      };
      updatedAlerts = [missingAlert, ...updatedAlerts];
    }

    // Dynamic alert trigger 2: Department budget ceiling >= 90%
    if (targetDept) {
      const newSpent = targetDept.spentAmount + data.amount;
      const pct = (newSpent / targetDept.allocatedBudget) * 100;
      if (pct >= 90) {
        const overAlert: SystemAlert = {
          id: `alt-over-${Date.now()}`,
          type: "overspend",
          severity: pct >= 100 ? "critical" : "warning",
          title: `${targetDept.name} Approaching Budget Cap`,
          message: `${targetDept.name} has reached ${pct.toFixed(1)}% of its allocated budget ($${newSpent.toLocaleString()} / $${targetDept.allocatedBudget.toLocaleString()}).`,
          timestamp: "Just now",
          isResolved: false,
        };
        updatedAlerts = [overAlert, ...updatedAlerts];
      }
    }

    persistAlerts(updatedAlerts);
    persistDepartments(updatedDepts);
    persistPockets(updatedPockets);
    persistTransactions([newTx, ...transactions]);

    // Asynchronous fire-and-forget push to Google Sheets Webhook if configured
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

  // 2. Approve/Reject Transaction with Financial Balancing & Refund
  const updateTransactionStatus = (id: string, newStatus: "approved" | "rejected") => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx || tx.status === newStatus) return;

    let updatedPockets = [...pockets];
    let updatedDepts = [...departments];

    // If changing TO rejected from an active expense (approved or pending), refund pocket & department
    if (newStatus === "rejected" && tx.status !== "rejected") {
      updatedPockets = updatedPockets.map((p) => {
        if (p.id === tx.pocketId) {
          return { ...p, balance: p.balance + tx.amount };
        }
        return p;
      });

      updatedDepts = updatedDepts.map((d) => {
        if (d.id === tx.departmentId) {
          return { ...d, spentAmount: Math.max(0, d.spentAmount - tx.amount) };
        }
        return d;
      });
    }

    // If changing FROM rejected back to approved, re-deduct
    if (tx.status === "rejected" && newStatus === "approved") {
      updatedPockets = updatedPockets.map((p) => {
        if (p.id === tx.pocketId) {
          return { ...p, balance: Math.max(0, p.balance - tx.amount) };
        }
        return p;
      });

      updatedDepts = updatedDepts.map((d) => {
        if (d.id === tx.departmentId) {
          return { ...d, spentAmount: d.spentAmount + tx.amount };
        }
        return d;
      });
    }

    persistPockets(updatedPockets);
    persistDepartments(updatedDepts);

    const updatedTx = transactions.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
    persistTransactions(updatedTx);
  };

  // 3. Delete Transaction with Refund
  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    if (tx.status !== "rejected") {
      const updatedPockets = pockets.map((p) => (p.id === tx.pocketId ? { ...p, balance: p.balance + tx.amount } : p));
      const updatedDepts = departments.map((d) =>
        d.id === tx.departmentId ? { ...d, spentAmount: Math.max(0, d.spentAmount - tx.amount) } : d
      );
      persistPockets(updatedPockets);
      persistDepartments(updatedDepts);
    }

    persistTransactions(transactions.filter((t) => t.id !== id));
  };

  // 4. Transfer Pocket Funds with Strict Overdraft Guard & Transfer Log
  const transferFunds = (
    sourcePocketId: string,
    destPocketId: string,
    amount: number,
    notes?: string
  ): { success: boolean; error?: string } => {
    if (sourcePocketId === destPocketId) {
      return { success: false, error: "Source and destination pockets cannot be identical." };
    }

    if (amount <= 0 || isNaN(amount)) {
      return { success: false, error: "Transfer amount must be a positive numeric value." };
    }

    const sourcePocket = pockets.find((p) => p.id === sourcePocketId);
    const destPocket = pockets.find((p) => p.id === destPocketId);

    if (!sourcePocket || !destPocket) {
      return { success: false, error: "Invalid pocket selection." };
    }

    if (sourcePocket.balance < amount) {
      return {
        success: false,
        error: `Insufficient liquid balance in ${sourcePocket.name}. Available: $${sourcePocket.balance.toLocaleString()}, Requested: $${amount.toLocaleString()}`,
      };
    }

    // Execute transfer
    const updatedPockets = pockets.map((p) => {
      if (p.id === sourcePocketId) {
        return { ...p, balance: p.balance - amount };
      }
      if (p.id === destPocketId) {
        return { ...p, balance: p.balance + amount };
      }
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

    // Alert if source pocket balance is low (<15% of allocation)
    const remainingSource = sourcePocket.balance - amount;
    if (remainingSource / sourcePocket.allocated < 0.15) {
      const lowBalAlert: SystemAlert = {
        id: `alt-bal-${Date.now()}`,
        type: "low_balance",
        severity: "warning",
        title: `Low Balance Warning on ${sourcePocket.name}`,
        message: `${sourcePocket.name} liquid balance is now down to $${remainingSource.toLocaleString()} (<15% allocation).`,
        timestamp: "Just now",
        isResolved: false,
      };
      persistAlerts([lowBalAlert, ...alerts]);
    }

    persistPockets(updatedPockets);
    persistTransfers([newTransfer, ...transfers]);

    return { success: true };
  };

  // 5. Toggle Task status
  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus: TaskStatus = t.status === "todo" ? "in_progress" : t.status === "in_progress" ? "completed" : "todo";
        return { ...t, status: nextStatus };
      }
      return t;
    });
    persistTasks(updated);
  };

  // 6. Add new Task
  const addTask = (task: Omit<Task, "id">) => {
    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      ...task,
    };
    persistTasks([...tasks, newTask]);
  };

  // 7. Delete Task
  const deleteTask = (taskId: string) => {
    persistTasks(tasks.filter((t) => t.id !== taskId));
  };

  // 8. Call Sheet Operations
  const updateCallSheet = (updates: Partial<DailyCallSheet>) => {
    const updated = { ...callSheet, ...updates };
    persistCallSheet(updated);
  };

  const advanceShootDay = () => {
    if (callSheet.dayNumber < callSheet.totalDays) {
      const nextDay = callSheet.dayNumber + 1;
      const updated: DailyCallSheet = {
        ...callSheet,
        dayNumber: nextDay,
        date: `Production Day ${nextDay} of ${callSheet.totalDays}`,
        scenesScheduled: `Scene ${nextDay * 3} & Scene ${nextDay * 3 + 1} (Scheduled for Day ${nextDay})`,
      };
      persistCallSheet(updated);
    }
  };

  // 9. Equipment Operations
  const addEquipment = (item: Omit<EquipmentRental, "id">) => {
    const newItem: EquipmentRental = {
      id: `eq-${Date.now().toString().slice(-4)}`,
      ...item,
    };
    persistEquipment([...equipment, newItem]);
  };

  const updateEquipmentStatus = (id: string, status: EquipmentStatus) => {
    const updated = equipment.map((e) => (e.id === id ? { ...e, status } : e));
    persistEquipment(updated);
  };

  const deleteEquipment = (id: string) => {
    persistEquipment(equipment.filter((e) => e.id !== id));
  };

  // 10. Dismiss / Resolve Alert
  const resolveAlert = (alertId: string) => {
    const updated = alerts.map((a) => (a.id === alertId ? { ...a, isResolved: true } : a));
    persistAlerts(updated);
  };

  // 11. Add Context Comment
  const addComment = (entityId: string, author: string, message: string) => {
    const newComment: ContextComment = {
      id: `c-${Date.now()}`,
      entityId,
      author,
      authorRole: "Crew",
      message,
      timestamp: "Just now",
    };
    persistComments([...comments, newComment]);
  };

  // 12. Data Sovereignty & BYOS Exports
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
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
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
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vaultData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `closebook_vault_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 13. Real Google Sheets / Drive Webhook Connector (BYOS)
  const persistWebhookConfig = (url: string, enabled: boolean) => {
    setWebhookUrl(url);
    setIsWebhookSyncEnabled(enabled);
    try {
      localStorage.setItem("closebook_webhook_url", url);
      localStorage.setItem("closebook_webhook_sync", enabled ? "true" : "false");
    } catch {}
  };

  const syncTransactionToWebhook = async (tx: Transaction): Promise<{ success: boolean; error?: string }> => {
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return { success: false, error: "No valid Webhook URL configured." };
    }
    try {
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "NEW_TRANSACTION",
          projectName: project.name,
          transaction: tx,
          timestamp: new Date().toISOString(),
        }),
      });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  };

  const bulkSyncToWebhook = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return { success: false, count: 0, error: "No valid Webhook URL configured." };
    }
    try {
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "BULK_SYNC",
          projectName: project.name,
          transactions,
          timestamp: new Date().toISOString(),
        }),
      });
      return { success: true, count: transactions.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, count: 0, error: msg };
    }
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
    webhookUrl,
    isWebhookSyncEnabled,
    persistWebhookConfig,
    syncTransactionToWebhook,
    bulkSyncToWebhook,
    addTransaction,
    updateTransactionStatus,
    deleteTransaction,
    transferFunds,
    toggleTask,
    addTask,
    deleteTask,
    updateCallSheet,
    advanceShootDay,
    addEquipment,
    updateEquipmentStatus,
    deleteEquipment,
    resolveAlert,
    addComment,
    exportLedgerCSV,
    exportProductionVaultJSON,
  };
}
