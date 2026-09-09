export type MemberRole = "producer" | "line_producer" | "upm" | "hod" | "crew";
export type TransactionStatus = "pending" | "approved" | "rejected" | "revision";
export type PocketType = "master_vault" | "operational_pocket" | "field_cash";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type EquipmentStatus = "rented" | "on_set" | "returned" | "damaged";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType = "overspend" | "low_balance" | "missing_receipt" | "pending_approval" | "daily_reconcile";

export interface Project {
  id: string;
  name: string;
  slug: string;
  currency: string;
  totalBudget: number;
  currentDisbursed: number;
  driveFolderId: string;
  sheetId: string;
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
}

export interface ContextComment {
  id: string;
  entityId: string;
  author: string;
  authorRole: string;
  message: string;
  timestamp: string;
}
