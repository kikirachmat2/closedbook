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
  SystemAlert,
  ContextComment,
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
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [callSheet, setCallSheet] = useState<DailyCallSheet>(INITIAL_CALLSHEET);
  const [equipment, setEquipment] = useState<EquipmentRental[]>(INITIAL_EQUIPMENT);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [comments, setComments] = useState<ContextComment[]>(INITIAL_COMMENTS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedTx = localStorage.getItem("closebook_tx");
      if (savedTx) setTransactions(JSON.parse(savedTx));
      const savedPockets = localStorage.getItem("closebook_pockets");
      if (savedPockets) setPockets(JSON.parse(savedPockets));
      const savedTasks = localStorage.getItem("closebook_tasks");
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      const savedDepts = localStorage.getItem("closebook_depts");
      if (savedDepts) setDepartments(JSON.parse(savedDepts));
      const savedAlerts = localStorage.getItem("closebook_alerts");
      if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
      const savedComments = localStorage.getItem("closebook_comments");
      if (savedComments) setComments(JSON.parse(savedComments));
    } catch {
      // ignore parsing error, fallback to initial
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
  }) => {
    const targetDept = departments.find((d) => d.id === data.departmentId);
    const targetPocket = pockets.find((p) => p.id === data.pocketId);

    const newTx: Transaction = {
      id: `TX-${Math.floor(106 + Math.random() * 800)}`,
      pocketId: data.pocketId,
      pocketName: targetPocket ? targetPocket.name : "Field Cash",
      departmentId: data.departmentId,
      departmentName: targetDept ? targetDept.name : "General",
      amount: data.amount,
      description: data.description,
      vendor: data.vendor || "Direct Vendor",
      status: "approved",
      loggedBy: "Field Unit PWA",
      loggedAt: "Just now",
      receiptUrl: data.receiptUrl || "/icon.png",
      isMissingReceipt: data.isMissingReceipt || false,
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

    persistDepartments(updatedDepts);
    persistPockets(updatedPockets);
    persistTransactions([newTx, ...transactions]);

    return newTx;
  };

  // 2. Approve/Reject Transaction
  const updateTransactionStatus = (id: string, status: "approved" | "rejected") => {
    const updated = transactions.map((t) => (t.id === id ? { ...t, status } : t));
    persistTransactions(updated);
  };

  // 3. Transfer Pocket Funds (e.g. Master Vault -> UPM Cash)
  const transferFunds = (sourcePocketId: string, destPocketId: string, amount: number) => {
    const updated = pockets.map((p) => {
      if (p.id === sourcePocketId) {
        return { ...p, balance: p.balance - amount };
      }
      if (p.id === destPocketId) {
        return { ...p, balance: p.balance + amount };
      }
      return p;
    });
    persistPockets(updated);
  };

  // 4. Toggle Task status
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

  // 5. Add new Task
  const addTask = (task: Omit<Task, "id">) => {
    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      ...task,
    };
    persistTasks([...tasks, newTask]);
  };

  // 6. Dismiss Alert
  const resolveAlert = (alertId: string) => {
    const updated = alerts.map((a) => (a.id === alertId ? { ...a, isResolved: true } : a));
    persistAlerts(updated);
  };

  // 7. Add Context Comment
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

  return {
    isLoaded,
    project,
    departments,
    pockets,
    transactions,
    tasks,
    callSheet,
    equipment,
    alerts,
    comments,
    addTransaction,
    updateTransactionStatus,
    transferFunds,
    toggleTask,
    addTask,
    resolveAlert,
    addComment,
  };
}
