export type MemberRole = "producer" | "line_producer" | "upm" | "hod" | "crew";
export type TransactionStatus = "pending" | "approved" | "rejected" | "revision";
export type PocketType = "master_vault" | "operational_pocket" | "field_cash";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type EquipmentStatus = "rented" | "on_set" | "returned" | "damaged";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType = "overspend" | "low_balance" | "missing_receipt" | "pending_approval" | "daily_reconcile" | "overdue_task";
export type ReconcileStatus = "open" | "balanced" | "discrepancy" | "signed_off";

export interface Project {
  id: string;
  name: string;
  slug: string;
  currency: string;
  totalBudget: number;
  currentDisbursed: number;
  driveFolderId: string;
  sheetId: string;
  shootDays: number;
  startDate: string;
  director: string;
  createdAt: string;
}

export interface ProjectShell {
  id: string;
  name: string;
  slug: string;
  totalBudget: number;
  shootDays: number;
  startDate: string;
  director: string;
  createdAt: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  allocatedBudget: number;
  spentAmount: number;
  color: string;
}

export interface Pocket {
  id: string;
  name: string;
  type: PocketType;
  custodian: string;
  balance: number;
  allocated: number;
}

export interface Transaction {
  id: string;
  pocketId: string;
  pocketName: string;
  departmentId: string;
  departmentName: string;
  amount: number;
  description: string;
  vendor: string;
  status: TransactionStatus;
  loggedBy: string;
  loggedAt: string;
  receiptUrl?: string;
  isMissingReceipt?: boolean;
  notes?: string;
}

export interface Task {
  id: string;
  departmentId: string;
  departmentName: string;
  title: string;
  description?: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

export interface DailyCallSheet {
  id: string;
  dayNumber: number;
  totalDays: number;
  date: string;
  callTime: string;
  estimatedWrap: string;
  locationName: string;
  locationAddress: string;
  weather: string;
  scenesScheduled: string;
  emergencyContact: string;
  directorNotes: string;
}

export interface EquipmentRental {
  id: string;
  itemName: string;
  vendor: string;
  department: string;
  dailyRate: number;
  returnDate: string;
  daysRemaining: number;
  status: EquipmentStatus;
}

export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  isResolved: boolean;
  entityId?: string;
}

export interface ContextComment {
  id: string;
  entityId: string;
  author: string;
  authorRole: string;
  message: string;
  timestamp: string;
}

export interface PocketTransfer {
  id: string;
  sourcePocketId: string;
  sourcePocketName: string;
  destPocketId: string;
  destPocketName: string;
  amount: number;
  authorizedBy: string;
  timestamp: string;
  notes?: string;
}

/** A single pocket count entry within a daily reconciliation */
export interface ReconcileEntry {
  pocketId: string;
  pocketName: string;
  systemBalance: number;    // balance from store at time of reconcile
  physicalCount: number;    // what the custodian physically counted
  discrepancy: number;      // physicalCount - systemBalance (negative = short)
  custodian: string;
  notes: string;
}

/** A complete end-of-day reconciliation record */
export interface DailyReconcile {
  id: string;
  dayNumber: number;
  date: string;
  status: ReconcileStatus;
  entries: ReconcileEntry[];
  totalSystemBalance: number;
  totalPhysicalCount: number;
  totalDiscrepancy: number;
  reconciledBy: string;
  signedOffBy?: string;
  signedOffAt?: string;
  createdAt: string;
}

/** Burn rate forecast data point */
export interface BurnRateForecast {
  dayNumber: number;
  projectedSpend: number;
  actualSpend?: number;
}

export type NoteCategory = "general" | "finance" | "logistics" | "creative" | "urgent";

/** A project-scoped freeform note with optional category and pin support */
export interface ProjectNote {
  id: string;
  author: string;
  content: string;
  category?: NoteCategory;
  createdAt: string;   // ISO timestamp
  isPinned: boolean;
}
