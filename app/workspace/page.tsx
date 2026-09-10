"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useClosebookStore } from "@/lib/store";
import { usePreferences } from "@/lib/preferences";
import PreferencesControls from "@/components/PreferencesControls";
import ReconciliationTab from "@/components/workspace/ReconciliationTab";
import OverviewTab from "@/components/workspace/OverviewTab";
import CommentDrawer from "@/components/CommentDrawer";
import { Transaction, EquipmentStatus, Department } from "@/lib/types";
import { m, AnimatePresence } from "@/components/MotionProvider";
import CountUp from "@/components/CountUp";
import { Skeleton, WorkspaceSkeleton } from "@/components/Skeleton";
import {
  LayoutDashboard,
  Receipt,
  WalletCards,
  CheckSquare,
  Film,
  Package,
  Bell,
  HardDrive,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  ArrowUpRight,
  Send,
  MessageSquare,
  MapPin,
  CloudRain,
  Phone,
  ArrowLeft,
  ArrowRight,
  X,
  Settings,
  Download,
  Trash2,
  Edit3,
  Calendar,
  Maximize2,
  UploadCloud,
  FileDown,
  Printer,
  Copy,
  Check,
  Code,
  Wifi,
  WifiOff,
  ChevronDown,
  ArrowLeftRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

type TabId =
  | "overview"
  | "transactions"
  | "pockets"
  | "tasks"
  | "callsheet"
  | "equipment"
  | "alerts"
  | "sync"
  | "reconcile";

const APPS_SCRIPT_TEMPLATE = `// =========================================================================
// CLOSEDBOOK PRODUCTION OS — GOOGLE APPS SCRIPT WEBHOOK BRIDGE (BYOS)
// =========================================================================
// Instructions:
// 1. Open your Google Sheet. Go to Extensions > Apps Script.
// 2. Paste this code and click Deploy > New Deployment.
// 3. Select type: "Web app". Set Who has access: "Anyone". Execute as: "Me".
// 4. Copy the Web App URL and paste it into ClosedBook > Google Sheet Mirror.

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    
    // Auto-create table headers if blank sheet
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Transaction ID", "Date", "Department", "Pocket",
        "Vendor", "Amount", "Description", "Status", "Notes"
      ]);
      sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#121212").setFontColor("#ffffff");
    }

    if (payload.event === "NEW_TRANSACTION") {
      var tx = payload.transaction;
      sheet.appendRow([
        tx.id, tx.loggedAt, tx.departmentName, tx.pocketName,
        tx.vendor, tx.amount, tx.description, tx.status, tx.notes || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", id: tx.id }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.event === "BULK_SYNC") {
      var txs = payload.transactions || [];
      txs.forEach(function(tx) {
        sheet.appendRow([
          tx.id, tx.loggedAt, tx.departmentName, tx.pocketName,
          tx.vendor, tx.amount, tx.description, tx.status, tx.notes || ""
        ]);
      });
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: txs.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ping_received" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function WorkspacePage() {
  const store = useClosebookStore();
  const {
    currency,
    language,
    formatMoney,
    t,
    setIsSettingsOpen,
    currencies,
    isRemindersEnabled,
    isWebNotificationsEnabled,
    geminiApiKey,
  } = usePreferences();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [taskDeptFilter, setTaskDeptFilter] = useState("all");

  // Network online/offline detection
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Webhook states
  const [tempWebhookUrl, setTempWebhookUrl] = useState(store.webhookUrl || "");
  const [isCopiedAppsScript, setIsCopiedAppsScript] = useState(false);
  const [webhookSyncStatus, setWebhookSyncStatus] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [showAppsScriptCode, setShowAppsScriptCode] = useState(false);

  useEffect(() => {
    if (store.webhookUrl) {
      setTempWebhookUrl(store.webhookUrl);
    }
  }, [store.webhookUrl]);

  const handleTestWebhook = async () => {
    if (!tempWebhookUrl || !tempWebhookUrl.startsWith("http")) {
      setWebhookSyncStatus("Please enter a valid Google Apps Script Web App URL.");
      return;
    }
    setIsTestingWebhook(true);
    setWebhookSyncStatus("Pinging Google Apps Script endpoint...");
    try {
      await fetch(tempWebhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "PING",
          timestamp: new Date().toISOString(),
          app: "ClosedBook",
        }),
      });
      store.persistWebhookConfig(tempWebhookUrl, true);
      setWebhookSyncStatus("Success: Ping sent to Google Apps Script!");
    } catch {
      setWebhookSyncStatus("Error: Could not reach endpoint.");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleBulkSync = async () => {
    setIsTestingWebhook(true);
    setWebhookSyncStatus("Pushing all transactions to Google Sheets...");
    const res = await store.bulkSyncToWebhook();
    if (res.success) {
      setWebhookSyncStatus(`Pushed ${res.count} transactions to Google Sheets!`);
    } else {
      setWebhookSyncStatus(res.error || "Sync failed. Check Webhook URL.");
    }
    setIsTestingWebhook(false);
  };

  const copyScriptCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setIsCopiedAppsScript(true);
    setTimeout(() => setIsCopiedAppsScript(false), 2500);
  };

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCallSheetModalOpen, setIsCallSheetModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Department | null>(null);
  const [activeCommentEntity, setActiveCommentEntity] = useState<{ id: string; title: string } | null>(null);
  const [previewReceiptTx, setPreviewReceiptTx] = useState<Transaction | null>(null);

  // Project Switcher & Management states
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isMobileProjectDropdownOpen, setIsMobileProjectDropdownOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSwitchConfirmModalOpen, setIsSwitchConfirmModalOpen] = useState(false);
  const [pendingSwitchProjectId, setPendingSwitchProjectId] = useState<string | null>(null);

  // Form states - New Project
  const [newProjName, setNewProjName] = useState("");
  const [newProjBudget, setNewProjBudget] = useState("");
  const [newProjDays, setNewProjDays] = useState("16");
  const [newProjDirector, setNewProjDirector] = useState("");
  const [newProjError, setNewProjError] = useState<string | null>(null);

  // Form states - Expense
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDept, setNewDept] = useState("cat-ops");
  const [newPocket, setNewPocket] = useState("pkt-upm");
  const [newVendor, setNewVendor] = useState("");
  const [missingReceiptCheck, setMissingReceiptCheck] = useState(false);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [receiptSizeKb, setReceiptSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // AI OCR States
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showOcrNoKeyGuidance, setShowOcrNoKeyGuidance] = useState(false);
  const [ocrSuccessToast, setOcrSuccessToast] = useState<string | null>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  // Form states - Transfer
  const [transferSource, setTransferSource] = useState("pkt-master");
  const [transferDest, setTransferDest] = useState("pkt-upm");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);

  // Form states - Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDept, setTaskDept] = useState("cat-crt");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  // Form states - Category
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catBudget, setCatBudget] = useState("");
  const [catColor, setCatColor] = useState("#14b8a6");
  const [catError, setCatError] = useState<string | null>(null);
  const [catBannerError, setCatBannerError] = useState<string | null>(null);

  // Form states - Call Sheet Edit
  const [csCallTime, setCsCallTime] = useState(store.callSheet.callTime);
  const [csWrapTime, setCsWrapTime] = useState(store.callSheet.estimatedWrap);
  const [csLocation, setCsLocation] = useState(store.callSheet.locationName);
  const [csAddress, setCsAddress] = useState(store.callSheet.locationAddress);
  const [csWeather, setCsWeather] = useState(store.callSheet.weather);
  const [csScenes, setCsScenes] = useState(store.callSheet.scenesScheduled);
  const [csNotes, setCsNotes] = useState(store.callSheet.directorNotes);
  const [csEmergency, setCsEmergency] = useState(store.callSheet.emergencyContact);

  // Form states - Equipment Add
  const [eqItemName, setEqItemName] = useState("");
  const [eqVendor, setEqVendor] = useState("");
  const [eqDept, setEqDept] = useState("Camera");
  const [eqDailyRate, setEqDailyRate] = useState("");
  const [eqReturnDate, setEqReturnDate] = useState("Oct 28");

  // Comment state
  const [commentText, setCommentText] = useState("");

  // Notes panel state
  const [noteText, setNoteText] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("Current User");
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(true);

  // Load shared comment author for notes (reuse CommentDrawer mechanism)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("closebook_comment_author");
      if (saved && saved.trim()) setNoteAuthor(saved.trim());
    } catch {}
  }, []);

  // Synchronize form dropdown defaults whenever active project or its departments/pockets change
  useEffect(() => {
    if (store.departments.length > 0) {
      if (!store.departments.some((d) => d.id === newDept)) {
        setNewDept(store.departments[0].id);
      }
      if (!store.departments.some((d) => d.id === taskDept)) {
        setTaskDept(store.departments[0].id);
      }
    }
    if (store.pockets.length > 0) {
      if (!store.pockets.some((p) => p.id === newPocket)) {
        setNewPocket(store.pockets[0].id);
      }
      if (!store.pockets.some((p) => p.id === transferSource)) {
        setTransferSource(store.pockets[0].id);
      }
      if (!store.pockets.some((p) => p.id === transferDest)) {
        setTransferDest(store.pockets.length > 1 ? store.pockets[1].id : store.pockets[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.project.id, store.departments, store.pockets]);

  const openLogModal = () => {
    if (store.departments.length > 0 && !store.departments.some((d) => d.id === newDept)) {
      setNewDept(store.departments[0].id);
    }
    if (store.pockets.length > 0 && !store.pockets.some((p) => p.id === newPocket)) {
      setNewPocket(store.pockets[0].id);
    }
    setIsLogModalOpen(true);
  };

  const openTransferModal = () => {
    if (store.pockets.length > 0) {
      if (!store.pockets.some((p) => p.id === transferSource)) {
        setTransferSource(store.pockets[0].id);
      }
      if (!store.pockets.some((p) => p.id === transferDest)) {
        setTransferDest(store.pockets.length > 1 ? store.pockets[1].id : store.pockets[0].id);
      }
    }
    setTransferError(null);
    setIsTransferModalOpen(true);
  };

  const openTaskModal = () => {
    if (store.departments.length > 0 && !store.departments.some((d) => d.id === taskDept)) {
      setTaskDept(store.departments[0].id);
    }
    setIsTaskModalOpen(true);
  };

  // ── Heartbeat Reminder Engine ─────────────────────────────────────────────
  const currentShootDay = store.callSheet.dayNumber || 1;
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);

  // Load dismissed reminders for current shoot day from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`closebook_dismissed_reminders_day_${currentShootDay}`);
      if (saved) {
        setDismissedReminders(JSON.parse(saved));
      } else {
        setDismissedReminders([]);
      }
    } catch {}
  }, [currentShootDay]);

  // Periodic and on-focus heartbeat re-evaluation
  const [, setHeartbeatTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setHeartbeatTick((v) => v + 1);
    window.addEventListener("focus", onFocus);
    const interval = setInterval(() => setHeartbeatTick((v) => v + 1), 30000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, []);

  // Heartbeat criteria:
  // a. Daily reconciliation for today is not completed
  const isReconDone = store.reconciliations.some((r) => r.dayNumber === currentShootDay);
  // b. Tasks overdue (due Day < current shoot day)
  const overdueTasks = store.tasks.filter((task) => {
    if (task.status === "completed") return false;
    const match = task.dueDate.match(/Day\s*(\d+)/i);
    if (!match) return false;
    return currentShootDay - parseInt(match[1], 10) > 0;
  });
  // c. Stale pending approvals (>24 hours old)
  const stalePendingTx = store.transactions.filter((tx) => {
    if (tx.status !== "pending") return false;
    if (!tx.createdAt) return false;
    return Date.now() - new Date(tx.createdAt).getTime() > 24 * 3600 * 1000;
  });

  const activeReminderKeys: string[] = [];
  if (!isReconDone) activeReminderKeys.push(`recon_day_${currentShootDay}`);
  if (overdueTasks.length > 0) activeReminderKeys.push(`overdue_tasks_day_${currentShootDay}`);
  if (stalePendingTx.length > 0) activeReminderKeys.push(`stale_tx_day_${currentShootDay}`);

  const activeNonDismissed = activeReminderKeys.filter((k) => !dismissedReminders.includes(k));
  const showReminderBanner = isRemindersEnabled && activeNonDismissed.length > 0;
  const totalActiveItems =
    (!isReconDone ? 1 : 0) + overdueTasks.length + stalePendingTx.length;

  const handleDismissReminder = () => {
    const updated = Array.from(new Set([...dismissedReminders, ...activeReminderKeys]));
    setDismissedReminders(updated);
    try {
      localStorage.setItem(
        `closebook_dismissed_reminders_day_${currentShootDay}`,
        JSON.stringify(updated)
      );
    } catch {}
  };

  // Progressive Web Notifications (opt-in)
  useEffect(() => {
    if (
      isWebNotificationsEnabled &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      activeNonDismissed.length > 0
    ) {
      const notifKey = `closebook_web_notif_sent_day_${currentShootDay}`;
      const alreadySent = sessionStorage.getItem(notifKey);
      if (!alreadySent) {
        try {
          new Notification("ClosedBook — Operational Reminder", {
            body: `Day ${currentShootDay}: ${totalActiveItems} operational item(s) require review.`,
            icon: "/icon.png",
          });
          sessionStorage.setItem(notifKey, "true");
        } catch {}
      }
    }
  }, [isWebNotificationsEnabled, activeNonDismissed.length, currentShootDay, totalActiveItems]);

  // Client-Side Photo Compression & EXIF Stripping
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Drawing to canvas natively strips GPS/EXIF metadata
          const compressed = canvas.toDataURL("image/jpeg", 0.75);
          setReceiptDataUrl(compressed);
          setReceiptSizeKb(Math.round((compressed.length * 0.75) / 1024));
          setMissingReceiptCheck(false);
        }
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI Scan (checks BYOK presence)
  const handleTriggerAiScan = () => {
    if (!geminiApiKey) {
      setShowOcrNoKeyGuidance(true);
      return;
    }
    setShowOcrNoKeyGuidance(false);
    setOcrError(null);
    if (ocrFileInputRef.current) {
      ocrFileInputRef.current.value = "";
      ocrFileInputRef.current.click();
    }
  };

  // Send compressed base64 to Gemini 1.5 Flash Vision API
  const processOcrImage = async (base64DataUrl: string) => {
    if (!geminiApiKey) return;
    setIsOcrScanning(true);
    setOcrError(null);
    setOcrSuccessToast(null);

    const mimeMatch = base64DataUrl.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Data = base64DataUrl.replace(/^data:[^;]+;base64,/, "");

    const prompt = `Analyze this receipt image for a film/project production expense. Return ONLY a valid, raw JSON object (strictly no markdown formatting, no code blocks, no backticks, no explanatory text). Use these exact keys:
{
  "vendor": "Merchant or store name (or 'Local Vendor' if unknown)",
  "amount": numeric total amount paid (number only, no currency symbols or commas, e.g. 240.00),
  "date": "YYYY-MM-DD" formatted date if visible, otherwise empty string,
  "categoryHint": "one of: 'OPS' (Operations/Logistics), 'CRT' (Camera/Creative), 'VND' (Vendors/Art/Wardrobe), 'ADM' (Office/Administrative)",
  "notes": "Brief summary of purchased items"
}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 400 || res.status === 403) {
          setOcrError(t("keyInvalid"));
        } else if (res.status === 429) {
          setOcrError(t("ocrRateLimitError"));
        } else {
          setOcrError(`Gemini API error (HTTP ${res.status}). Please enter details manually.`);
        }
        setIsOcrScanning(false);
        return;
      }

      const data = await res.json();
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        setOcrError(t("ocrParseError"));
        setIsOcrScanning(false);
        return;
      }

      let parsed: { vendor?: string; amount?: number; date?: string; categoryHint?: string; notes?: string };
      try {
        const cleaned = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        setOcrError(t("ocrParseError"));
        setIsOcrScanning(false);
        return;
      }

      // Autofill fields without auto-submitting
      if (parsed.vendor) {
        setNewVendor(parsed.vendor);
      }
      if (parsed.amount && !isNaN(parsed.amount) && parsed.amount > 0) {
        setNewAmount(String(parsed.amount));
      }
      if (parsed.notes) {
        setNewDesc(parsed.notes);
      } else if (parsed.vendor) {
        setNewDesc(`${parsed.vendor} Purchase`);
      }

      if (parsed.categoryHint) {
        const hint = parsed.categoryHint.toUpperCase().trim();
        const matched = store.departments.find(
          (d) => d.code.toUpperCase() === hint || d.id.toUpperCase().includes(hint) || d.name.toUpperCase().includes(hint)
        );
        if (matched) {
          setNewDept(matched.id);
        }
      }

      setOcrSuccessToast(
        t("ocrSuccessToast", {
          vendor: parsed.vendor || "Receipt",
          amount: parsed.amount ? `${currencies[currency]?.symbol || "$"}${parsed.amount}` : "",
        })
      );
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setOcrError("Gemini request timed out (20s). Please enter details manually.");
      } else if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOcrError(t("ocrNetworkError"));
      } else {
        setOcrError("Network or connection error while contacting Gemini API. Please enter details manually.");
      }
    } finally {
      setIsOcrScanning(false);
    }
  };

  const handleAiReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.78);
          setReceiptDataUrl(compressed);
          setReceiptSizeKb(Math.round((compressed.length * 0.75) / 1024));
          setMissingReceiptCheck(false);

          processOcrImage(compressed);
        }
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Filtered transactions
  const filteredTransactions = store.transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === "all" || tx.departmentId === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Filtered tasks
  const filteredTasks = store.tasks.filter((task) => {
    return taskDeptFilter === "all" || task.departmentId === taskDeptFilter;
  });

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;

    const rate = currencies[currency]?.rate || 1;
    const amountInUSD = parseFloat(newAmount) / rate;

    // Resolve project-scoped IDs dynamically to prevent desync
    const resolvedDeptId = store.departments.some((d) => d.id === newDept)
      ? newDept
      : (store.departments[0]?.id || newDept);
    const resolvedPocketId = store.pockets.some((p) => p.id === newPocket)
      ? newPocket
      : (store.pockets[0]?.id || newPocket);

    store.addTransaction({
      description: newDesc,
      amount: amountInUSD,
      departmentId: resolvedDeptId,
      pocketId: resolvedPocketId,
      vendor: newVendor || "Local Vendor",
      isMissingReceipt: missingReceiptCheck,
      receiptUrl: receiptDataUrl || (missingReceiptCheck ? undefined : "/icon.png"),
    });

    setNewDesc("");
    setNewAmount("");
    setNewVendor("");
    setMissingReceiptCheck(false);
    setReceiptDataUrl(null);
    setReceiptSizeKb(null);
    setOcrError(null);
    setOcrSuccessToast(null);
    setShowOcrNoKeyGuidance(false);
    setIsLogModalOpen(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    if (!transferAmount) return;

    const rate = currencies[currency]?.rate || 1;
    const amountInUSD = parseFloat(transferAmount) / rate;

    const resolvedSource = store.pockets.some((p) => p.id === transferSource)
      ? transferSource
      : (store.pockets[0]?.id || transferSource);
    const resolvedDest = store.pockets.some((p) => p.id === transferDest && p.id !== resolvedSource)
      ? transferDest
      : (store.pockets.find((p) => p.id !== resolvedSource)?.id || store.pockets[0]?.id || transferDest);

    const result = store.transferFunds(resolvedSource, resolvedDest, amountInUSD, transferNotes);
    if (!result.success) {
      setTransferError(result.error || "Transfer failed");
      return;
    }

    setTransferAmount("");
    setTransferNotes("");
    setIsTransferModalOpen(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    const targetDept = store.departments.find((d) => d.id === taskDept) || store.departments[0];
    const resolvedDeptId = targetDept ? targetDept.id : taskDept;
    const resolvedDeptName = targetDept ? targetDept.name : "Production";

    store.addTask({
      title: taskTitle,
      departmentId: resolvedDeptId,
      departmentName: resolvedDeptName,
      assignee: taskAssignee || "Unassigned",
      priority: taskPriority,
      status: "todo",
      dueDate: `Day ${store.callSheet.dayNumber}`,
    });
    setTaskTitle("");
    setTaskAssignee("");
    setIsTaskModalOpen(false);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatCode("");
    setCatBudget("");
    setCatColor("#14b8a6");
    setCatError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (dept: Department) => {
    setEditingCategory(dept);
    setCatName(dept.name);
    setCatCode(dept.code);
    const rate = currencies[currency]?.rate || 1;
    setCatBudget((dept.allocatedBudget * rate).toString());
    setCatColor(dept.color);
    setCatError(null);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catCode || !catBudget) {
      setCatError("All fields are required");
      return;
    }

    const rate = currencies[currency]?.rate || 1;
    const budgetUSD = parseFloat(catBudget) / rate;
    if (isNaN(budgetUSD) || budgetUSD <= 0) {
      setCatError("Please enter a valid budget amount");
      return;
    }

    if (editingCategory) {
      store.updateDepartment(editingCategory.id, {
        name: catName,
        code: catCode.toUpperCase().slice(0, 5),
        allocatedBudget: budgetUSD,
        color: catColor,
      });
    } else {
      store.addDepartment({
        name: catName,
        code: catCode.toUpperCase().slice(0, 5),
        allocatedBudget: budgetUSD,
        color: catColor,
      });
    }

    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (deptId: string) => {
    setCatBannerError(null);
    if (confirm(t("confirmDeleteCategory"))) {
      const res = store.deleteDepartment(deptId);
      if (!res.success) {
        setCatBannerError(res.error || "Cannot delete category with associated transactions");
        setTimeout(() => setCatBannerError(null), 5000);
      }
    }
  };

  const handleSaveCallSheet = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateCallSheet({
      callTime: csCallTime,
      estimatedWrap: csWrapTime,
      locationName: csLocation,
      locationAddress: csAddress,
      weather: csWeather,
      scenesScheduled: csScenes,
      directorNotes: csNotes,
      emergencyContact: csEmergency,
    });
    setIsCallSheetModalOpen(false);
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqItemName || !eqDailyRate) return;

    const rate = currencies[currency]?.rate || 1;
    const dailyInUSD = parseFloat(eqDailyRate) / rate;

    store.addEquipment({
      itemName: eqItemName,
      vendor: eqVendor || "General Rental House",
      department: eqDept,
      dailyRate: dailyInUSD,
      returnDate: eqReturnDate,
      daysRemaining: 14,
      status: "on_set",
    });

    setEqItemName("");
    setEqVendor("");
    setEqDailyRate("");
    setIsEquipmentModalOpen(false);
  };

  const handleSendComment = (entityId: string) => {
    if (!commentText.trim()) return;
    store.addComment(entityId, "Current User (UPM)", commentText.trim());
    setCommentText("");
  };

  const handleInitiateSwitchProject = (targetId: string) => {
    if (targetId === store.project.id) {
      setIsProjectDropdownOpen(false);
      setIsMobileProjectDropdownOpen(false);
      return;
    }
    setPendingSwitchProjectId(targetId);
    setIsSwitchConfirmModalOpen(true);
    setIsProjectDropdownOpen(false);
    setIsMobileProjectDropdownOpen(false);
  };

  const handleConfirmSwitchProject = () => {
    if (pendingSwitchProjectId) {
      store.switchProject(pendingSwitchProjectId);
    }
    setPendingSwitchProjectId(null);
    setIsSwitchConfirmModalOpen(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      setNewProjError("Project name is required.");
      return;
    }
    const budgetNum = parseFloat(newProjBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setNewProjError("Please enter a valid total budget.");
      return;
    }
    const daysNum = parseInt(newProjDays, 10);
    if (isNaN(daysNum) || daysNum <= 0) {
      setNewProjError("Please enter valid shoot duration days.");
      return;
    }
    if (!newProjDirector.trim()) {
      setNewProjError("Director / Producer name is required.");
      return;
    }

    const newId = store.createProject(
      newProjName.trim(),
      budgetNum,
      daysNum,
      newProjDirector.trim()
    );
    store.switchProject(newId);

    // Reset form
    setNewProjName("");
    setNewProjBudget("");
    setNewProjDays("16");
    setNewProjDirector("");
    setNewProjError(null);
    setIsNewProjectModalOpen(false);
  };

  const totalSpent = store.departments.reduce((acc, d) => acc + d.spentAmount, 0);
  const totalAllocated = store.departments.reduce((acc, d) => acc + d.allocatedBudget, 0);
  const activeAlertsCount = store.alerts.filter((a) => !a.isResolved).length;

  const totalDailyEquipmentBurn = store.equipment
    .filter((e) => e.status === "on_set" || e.status === "rented")
    .reduce((acc, e) => acc + e.dailyRate, 0);

  return (
    <div className="min-h-screen bg-[var(--surface-canvas,#050505)] text-[var(--color-paper,#fdfdfd)] selection:bg-[var(--color-primary,#ff1e42)] selection:text-[#ffffff] flex flex-col md:flex-row pb-20 md:pb-0">
      {/* 1. Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-[#090909] border-r border-white/[0.06] flex-col justify-between shrink-0 p-5">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-3 min-h-[44px]">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <Image src="/icon.png" alt="ClosedBook" width={32} height={32} className="object-contain" />
              </div>
              <span className="text-base font-medium tracking-tight text-[#fdfdfd]">
                closedbook<span className="text-[var(--color-primary,#ff1e42)]">.</span>
              </span>
            </Link>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#181818] text-[#a3a3a3] border border-white/[0.06]">
              OS v1.1
            </span>
          </div>

          {/* Project Switcher Dropdown Anchor */}
          <div className="relative mb-6">
            <button
              id="project-switcher-btn"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full text-left surface-overlay p-3.5 rounded-xl border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#121212] transition-all group min-h-[44px] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#ff1e42)]/50 cursor-pointer"
              aria-expanded={isProjectDropdownOpen}
              aria-label={t("switchProject")}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#737373] font-medium truncate">
                  {t("activeProduction")}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-[#a3a3a3] border border-white/[0.06] shrink-0">
                  {store.projects.length} {store.projects.length === 1 ? "project" : "projects"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#fdfdfd] truncate group-hover:text-[var(--color-primary,#ff1e42)] transition-colors">
                  {store.project.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#737373] transition-transform duration-200 shrink-0 ${isProjectDropdownOpen ? "rotate-180 text-white" : ""}`} />
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-[#a3a3a3]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary,#ff1e42)] animate-pulse shrink-0" />
                <span className="truncate">
                  {t("dayCount")
                    .replace("{day}", store.callSheet.dayNumber.toString())
                    .replace("{total}", store.callSheet.totalDays.toString())}
                </span>
                <span>•</span>
                <span className="text-[#10b981] font-medium font-mono text-[10px]">{formatMoney(store.project.totalBudget)}</span>
              </div>
            </button>

            {/* Desktop Dropdown Popover */}
            <AnimatePresence>
              {isProjectDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProjectDropdownOpen(false)}
                  />
                  <m.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0d0d0d] border border-white/[0.12] rounded-xl shadow-2xl p-2 max-h-80 overflow-y-auto backdrop-blur-xl"
                  >
                    <div className="px-2 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#737373] border-b border-white/[0.06] flex items-center justify-between mb-1">
                      <span>{t("allProjects")}</span>
                      <span>{store.projects.length}</span>
                    </div>

                    <div className="space-y-1 my-1">
                      {store.projects.map((proj) => {
                        const isCurrent = proj.id === store.project.id;
                        return (
                          <button
                            key={proj.id}
                            id={`switch-to-project-${proj.id}`}
                            onClick={() => handleInitiateSwitchProject(proj.id)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start justify-between gap-2 group min-h-[44px] cursor-pointer ${
                              isCurrent
                                ? "bg-white/[0.08] text-white border border-white/[0.08]"
                                : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-xs truncate text-[#fdfdfd]">
                                  {proj.name}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-[var(--color-primary,#ff1e42)]/20 text-[var(--color-primary,#ff1e42)] font-mono border border-[var(--color-primary,#ff1e42)]/30">
                                    {t("activeBadge")}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#737373] flex items-center gap-1.5 mt-0.5 font-mono">
                                <span>{formatMoney(proj.totalBudget)}</span>
                                <span>•</span>
                                <span>{proj.shootDays} days</span>
                              </div>
                            </div>
                            {isCurrent && (
                              <Check className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)] shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1 mt-1 border-t border-white/[0.06]">
                      <button
                        id="btn-open-new-project-modal"
                        onClick={() => {
                          setIsProjectDropdownOpen(false);
                          setIsNewProjectModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-white transition-all border border-white/[0.06] min-h-[44px] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)]" />
                        <span>{t("newProject")}</span>
                      </button>
                    </div>
                  </m.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
              <span>{t("tabOverview")}</span>
            </button>

            <button
              onClick={() => setActiveTab("transactions")}
              className={`w-full flex items-center justify-between px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "transactions"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
                <span>{t("tabLedger")}</span>
              </div>
              <span className="text-[10px] font-mono text-[#737373] bg-[#121212] px-2 py-0.5 rounded-full">
                {store.transactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("pockets")}
              className={`w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "pockets"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <WalletCards className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
              <span>{t("tabPockets")}</span>
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center justify-between px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "tasks"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
                <span>{t("tabTasks")}</span>
              </div>
              <span className="text-[10px] font-mono text-[#737373] bg-[#121212] px-2 py-0.5 rounded-full">
                {store.tasks.filter((t) => t.status !== "completed").length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("callsheet")}
              className={`w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "callsheet"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <Film className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
              <span>{t("tabCallSheet")}</span>
            </button>

            <button
              onClick={() => setActiveTab("equipment")}
              className={`w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "equipment"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <Package className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
              <span>{t("tabEquipment")}</span>
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`w-full flex items-center justify-between px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "alerts"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
                <span>{t("tabAlerts")}</span>
              </div>
              {activeAlertsCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-white bg-[var(--color-primary,#ff1e42)] px-2 py-0.5 rounded-full">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("sync")}
              className={`w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "sync"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
              <span>{t("tabSheet")}</span>
            </button>

            <button
              onClick={() => setActiveTab("reconcile")}
              className={`w-full flex items-center justify-between px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "reconcile"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
                <span>Reconcile</span>
              </div>
              {store.reconciliations.filter(r => r.dayNumber === store.callSheet.dayNumber).length === 0 && (
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] shrink-0" />
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Controls */}
        <div className="pt-6 border-t border-white/[0.06] space-y-2.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full btn-ghost-pill text-xs min-h-[44px] flex items-center justify-center gap-2 text-[#a3a3a3] hover:text-[#fdfdfd]"
          >
            <Settings className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
            <span>{t("preferences")} ({currency} • {language.toUpperCase()})</span>
          </button>

          <button
            onClick={openLogModal}
            className="w-full btn-primary-crimson text-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t("logExpense")}</span>
          </button>

          <Link
            href="/"
            className="w-full btn-ghost-pill text-xs min-h-[44px] text-center flex items-center justify-center gap-1.5 text-[#737373] hover:text-[#fdfdfd]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Site</span>
          </Link>
        </div>
      </aside>

      {/* 2. Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/[0.06] bg-[var(--surface-canvas,#050505)]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Brand Logo */}
            <Link href="/" className="md:hidden flex items-center gap-2 min-h-[44px]">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center">
                <Image src="/icon.png" alt="ClosedBook" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-sm font-medium tracking-tight text-[#fdfdfd]">
                closedbook<span className="text-[var(--color-primary,#ff1e42)]">.</span>
              </span>
            </Link>

            {/* Mobile Project Switcher Pill */}
            <div className="relative md:hidden">
              <button
                id="mobile-project-switcher-btn"
                onClick={() => setIsMobileProjectDropdownOpen(!isMobileProjectDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141414] border border-white/[0.08] hover:border-white/[0.16] text-[11px] font-medium text-[#fdfdfd] max-w-[150px] truncate min-h-[44px] cursor-pointer"
                aria-expanded={isMobileProjectDropdownOpen}
                aria-label={t("switchProject")}
              >
                <span className="truncate">{store.project.name}</span>
                <ChevronDown className={`w-3 h-3 text-[#737373] shrink-0 transition-transform duration-200 ${isMobileProjectDropdownOpen ? "rotate-180 text-white" : ""}`} />
              </button>

              {/* Mobile Popover */}
              <AnimatePresence>
                {isMobileProjectDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
                      onClick={() => setIsMobileProjectDropdownOpen(false)}
                    />
                    <m.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="fixed left-4 right-4 top-16 z-50 bg-[#0d0d0d] border border-white/[0.12] rounded-xl shadow-2xl p-3 max-h-96 overflow-y-auto backdrop-blur-xl"
                    >
                      <div className="px-2 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#737373] border-b border-white/[0.06] flex items-center justify-between mb-2">
                        <span>{t("allProjects")}</span>
                        <span>{store.projects.length}</span>
                      </div>

                      <div className="space-y-1.5 my-1">
                        {store.projects.map((proj) => {
                          const isCurrent = proj.id === store.project.id;
                          return (
                            <button
                              key={proj.id}
                              id={`mobile-switch-to-project-${proj.id}`}
                              onClick={() => handleInitiateSwitchProject(proj.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between gap-2 min-h-[44px] cursor-pointer ${
                                isCurrent
                                  ? "bg-white/[0.08] text-white border border-white/[0.08]"
                                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-xs truncate text-[#fdfdfd]">
                                    {proj.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-[var(--color-primary,#ff1e42)]/20 text-[var(--color-primary,#ff1e42)] font-mono border border-[var(--color-primary,#ff1e42)]/30">
                                      {t("activeBadge")}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#737373] flex items-center gap-1.5 mt-0.5 font-mono">
                                  <span>{formatMoney(proj.totalBudget)}</span>
                                  <span>•</span>
                                  <span>{proj.shootDays} days</span>
                                </div>
                              </div>
                              {isCurrent && (
                                <Check className="w-4 h-4 text-[var(--color-primary,#ff1e42)] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 mt-2 border-t border-white/[0.06]">
                        <button
                          id="btn-mobile-open-new-project-modal"
                          onClick={() => {
                            setIsMobileProjectDropdownOpen(false);
                            setIsNewProjectModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-white transition-all border border-white/[0.06] min-h-[44px] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)]" />
                          <span>{t("newProject")}</span>
                        </button>
                      </div>
                    </m.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:block">
              <h1 className="text-sm font-medium text-[#fdfdfd] capitalize">
                {activeTab === "overview" && t("tabOverview")}
                {activeTab === "transactions" && t("tabLedger")}
                {activeTab === "pockets" && t("tabPockets")}
                {activeTab === "tasks" && t("tabTasks")}
                {activeTab === "callsheet" && t("tabCallSheet")}
                {activeTab === "equipment" && t("tabEquipment")}
                {activeTab === "alerts" && t("tabAlerts")}
                {activeTab === "sync" && t("tabSheet")}
                {activeTab === "reconcile" && "Daily Reconciliation"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Selector */}
            <div className="hidden sm:flex items-center">
              <PreferencesControls compact={true} />
            </div>

            <div className="flex sm:hidden items-center">
              <PreferencesControls compact={true} />
            </div>

            {/* Online / Offline Status Pill */}
            <div
              id="workspace-network-status"
              className={`items-center gap-2 px-3 py-1.5 rounded-full border text-xs min-h-[36px] transition-colors ${
                isOnline
                  ? "hidden lg:flex bg-[#121212] border-white/[0.06] text-[#a3a3a3]"
                  : "flex bg-amber-500/15 border-amber-500/40 text-amber-400 font-medium"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium text-[11px]">{t("onlineStatus")}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-amber-400 font-medium text-[11px]">{t("offlineMode")}</span>
                </>
              )}
            </div>

            {/* Print Wrap Report Button */}
            <button
              onClick={() => window.print()}
              className="btn-ghost-pill text-xs min-h-[38px] px-3 hidden md:inline-flex items-center gap-1.5 text-[#a3a3a3] hover:text-white"
              title={t("printWrapReport")}
            >
              <Printer className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)]" />
              <span>Print Wrap</span>
            </button>

            <button
              onClick={openLogModal}
              className="btn-primary-crimson text-xs min-h-[40px] px-3.5 hidden sm:inline-flex"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("logExpense")}</span>
            </button>
          </div>
        </header>

        {/* Tab Content Panels with AnimatePresence Transitions */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-1">
          {/* Storage Quota Guard Warning Banner */}
          <AnimatePresence>
            {store.storageQuotaExceeded && (
              <m.div
                key="storage-quota-warning-banner"
                id="storage-quota-warning-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden", marginBottom: 0, transition: { duration: 0.18 } }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="surface-overlay p-3.5 sm:p-4 rounded-xl border border-rose-500/40 bg-rose-500/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg mb-6"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-rose-200">
                        {t("storageQuotaTitle")}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">
                      {t("storageQuotaDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    id="btn-download-emergency-backup"
                    onClick={() => store.exportProductionVaultJSON()}
                    className="px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors min-h-[36px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("downloadBackup")}</span>
                  </button>
                  <button
                    id="btn-dismiss-storage-quota"
                    onClick={() => store.clearStorageQuotaWarning()}
                    className="p-1.5 rounded-full hover:bg-white/10 text-rose-300 hover:text-white transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Proactive Heartbeat Reminder Banner */}
          <AnimatePresence>
            {showReminderBanner && (
              <m.div
                key="heartbeat-reminder-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden", marginBottom: 0, transition: { duration: 0.18 } }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                data-testid="reminder-heartbeat-banner"
                className="surface-overlay p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md mb-6"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Bell className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-200">
                        {totalActiveItems} {t("reminderPendingItems")}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#a3a3a3] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {!isReconDone && (
                        <span className="text-amber-300/90 font-medium">
                          • {t("reminderReconIncomplete", { day: currentShootDay })}
                        </span>
                      )}
                      {overdueTasks.length > 0 && (
                        <span className="text-amber-300/90 font-medium">
                          • {overdueTasks.length === 1
                            ? t("reminderOverdueTasks", { count: overdueTasks.length })
                            : t("reminderOverdueTasksPlural", { count: overdueTasks.length })}
                        </span>
                      )}
                      {stalePendingTx.length > 0 && (
                        <span className="text-amber-300/90 font-medium">
                          • {stalePendingTx.length === 1
                            ? t("reminderPendingApprovals", { count: stalePendingTx.length })
                            : t("reminderPendingApprovalsPlural", { count: stalePendingTx.length })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isReconDone) setActiveTab("reconcile");
                      else if (overdueTasks.length > 0) setActiveTab("tasks");
                      else setActiveTab("transactions");
                    }}
                    className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 transition-colors flex items-center gap-1.5"
                    data-testid="resolve-reminder-btn"
                  >
                    {t("resolveNow")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissReminder}
                    data-testid="dismiss-reminder-btn"
                    className="text-xs text-[#a3a3a3] hover:text-[#fdfdfd] p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Dismiss reminder"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <m.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full space-y-6 sm:space-y-8"
            >
          {/* =========================================================================
           * RECONCILIATION TAB
           * =========================================================================*/}
          {activeTab === "reconcile" && (
            <div>
              <ReconciliationTab
                pockets={store.pockets}
                reconciliations={store.reconciliations}
                currentDay={store.callSheet.dayNumber}
                currentDate={store.callSheet.date}
                formatMoney={formatMoney}
                onReconcile={store.reconcileDay}
                onSignOff={store.signOffReconciliation}
              />
            </div>
          )}

          {/* =========================================================================
           * OVERVIEW TAB (now uses extracted OverviewTab component with burn forecast)
           * =========================================================================*/}
          {activeTab === "overview" && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="surface-panel surface-panel-hover p-5">
                  <span className="text-xs text-[#737373] block mb-1">{t("totalBudget")}</span>
                  <span className="text-3xl font-display font-bold text-[#fdfdfd] tracking-wide block">
                    <CountUp end={store.project.totalBudget} formatter={formatMoney} />
                  </span>
                  <span className="text-[11px] text-[#a3a3a3] mt-2 block">{t("budgetCommitted")}</span>
                </div>

                <div className="surface-panel surface-panel-hover p-5">
                  <span className="text-xs text-[#737373] block mb-1">{t("disbursedToDepts")}</span>
                  <span className="text-3xl font-display font-bold text-[#fdfdfd] tracking-wide block">
                    <CountUp end={totalSpent} formatter={formatMoney} />
                  </span>
                  <span className="text-[11px] text-[var(--color-primary,#ff1e42)] mt-2 block font-medium">
                    {((totalSpent / (totalAllocated || 1)) * 100).toFixed(1)}% {t("burnRate")}
                  </span>
                </div>

                <div className="surface-panel surface-panel-hover p-5">
                  <span className="text-xs text-[#737373] block mb-1">{t("fieldCashOnHand")}</span>
                  <span className="text-3xl font-display font-bold text-[#10b981] tracking-wide block">
                    <CountUp
                      end={store.pockets.find((p) => p.id === "pkt-upm")?.balance || 8420}
                      formatter={formatMoney}
                    />
                  </span>
                  <span className="text-[11px] text-[#a3a3a3] mt-2 block">{t("cashSufficient")}</span>
                </div>

                <div className="surface-panel surface-panel-hover p-5">
                  <span className="text-xs text-[#737373] block mb-1">{t("activeAlerts")}</span>
                  <span className="text-3xl font-display font-bold text-[var(--color-primary,#ff1e42)] tracking-wide block">
                    <CountUp end={activeAlertsCount} formatter={(n) => `${n} Flags`} />
                  </span>
                  <span className="text-[11px] text-[#a3a3a3] mt-2 block">{t("auditRequired")}</span>
                </div>
              </div>

              {/* ── Burn Rate Forecast Banner ── */}
              {(() => {
                const forecast = store.getBurnRateForecast();
                return (
                  <div className={`rounded-2xl border p-5 ${forecast.projectedOverBudget ? "bg-[#1a0a0a] border-[#ff1e42]/30" : "bg-[#0a1a0f] border-[#10b981]/20"}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <span className={`text-[11px] uppercase tracking-wider font-semibold ${forecast.projectedOverBudget ? "text-[#ff1e42]" : "text-[#10b981]"}`}>
                          {forecast.projectedOverBudget ? "⚠ Burn Rate Alert" : "✓ Burn Rate Forecast"}
                        </span>
                        <p className="text-xl font-bold text-[#fdfdfd] mt-1">
                          {formatMoney(forecast.dailyBurnRate)} <span className="text-sm font-normal text-[#737373]">/ day avg</span>
                        </p>
                        <p className={`text-xs mt-1 ${forecast.projectedOverBudget ? "text-[#ff1e42]" : "text-[#10b981]"}`}>
                          {forecast.projectedOverBudget
                            ? `Projected overrun: ${formatMoney(forecast.projectedTotal - store.project.totalBudget)} over budget`
                            : `On-track — projected final spend: ${formatMoney(forecast.projectedTotal)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#737373]">Days remaining</p>
                        <p className="text-2xl font-bold text-[#fdfdfd]">{forecast.daysRemaining}</p>
                        {forecast.daysUntilBudgetExhausted !== null && (
                          <p className="text-[11px] text-[#f59e0b] mt-0.5">Budget exhausted in ~{forecast.daysUntilBudgetExhausted}d</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-[#737373] mb-1.5">
                        <span>{forecast.budgetUtilizationPct.toFixed(1)}% consumed</span>
                        <span>{formatMoney(forecast.totalSpent)} / {formatMoney(store.project.totalBudget)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${forecast.budgetUtilizationPct > 90 ? "bg-[#ff1e42]" : forecast.budgetUtilizationPct > 70 ? "bg-[#f59e0b]" : "bg-[#10b981]"}`}
                          style={{ width: `${Math.min(100, forecast.budgetUtilizationPct)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Department Budget Burn-rate Progress Bars */}
              <div className="surface-panel p-5 sm:p-6">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-medium text-[#fdfdfd]">{t("deptBudgetRealization")}</h3>
                    <p className="text-xs text-[#737373] mt-0.5">{t("deptBudgetSub")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#a3a3a3] font-mono hidden sm:inline">
                      {store.departments.length} {t("colDept") || "Categories"}
                    </span>
                    <button
                      onClick={openAddCategory}
                      className="btn-ghost-pill text-xs flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] hover:text-[var(--color-primary,#ff1e42)]"
                      title={t("addCategory")}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("addCategory")}</span>
                    </button>
                  </div>
                </div>

                {catBannerError && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{catBannerError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {store.departments.map((dept) => {
                    const pct = Math.min(100, Math.round((dept.spentAmount / (dept.allocatedBudget || 1)) * 100));
                    const isHigh = pct >= 80;
                    return (
                      <div key={dept.id} className="space-y-2 group/cat relative p-2.5 -m-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-medium text-[#fdfdfd]">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                            <span>{dept.name}</span>
                            <span className="text-[10px] font-mono text-[#737373] px-1.5 py-0.5 rounded bg-white/[0.04]">
                              {dept.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[#a3a3a3]">
                            <span>
                              {formatMoney(dept.spentAmount)} / {formatMoney(dept.allocatedBudget)}
                              <span className={`ml-2 font-bold ${isHigh ? "text-[var(--color-primary,#ff1e42)]" : "text-[#737373]"}`}>
                                ({pct}%)
                              </span>
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity ml-1">
                              <button
                                onClick={() => openEditCategory(dept)}
                                className="p-1 hover:text-white text-[#737373] transition-colors"
                                title={t("editCategory")}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(dept.id)}
                                className="p-1 hover:text-[#ff1e42] text-[#737373] transition-colors"
                                title={t("deleteCategory")}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-[#181818] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: isHigh ? "var(--color-primary, #ff1e42)" : dept.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Split: Recent Ledger & Live Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-7 surface-panel p-5 sm:p-6">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-medium text-[#fdfdfd]">{t("recentEntries")}</h3>
                    <button
                      onClick={() => setActiveTab("transactions")}
                      className="text-xs text-[var(--color-primary,#ff1e42)] hover:underline min-h-[36px] flex items-center"
                    >
                      {t("viewAllLedger")}
                    </button>
                  </div>

                  <div className="divide-y divide-white/[0.04] text-xs">
                    {store.transactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="py-3.5 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[#fdfdfd] flex items-center gap-2">
                            {tx.description}
                            <span className="text-[10px] font-mono text-[#737373]">{tx.id}</span>
                          </div>
                          <div className="text-[11px] text-[#737373] mt-0.5">
                            <span>{tx.departmentName}</span> • <span>{tx.vendor}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-medium text-sm text-[#fdfdfd] block">
                            {formatMoney(tx.amount)}
                          </span>
                          <span
                            className={`text-[10px] font-medium capitalize ${
                              tx.status === "approved"
                                ? "text-[#10b981]"
                                : tx.status === "rejected"
                                ? "text-[var(--color-primary,#ff1e42)]"
                                : "text-amber-400"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live System Alerts */}
                <div className="lg:col-span-5 surface-panel p-5 sm:p-6">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-medium text-[#fdfdfd]">{t("activeFlags")}</h3>
                    <span className="text-xs text-[#737373]">Autonomous Guardrails</span>
                  </div>

                  <div className="space-y-3">
                    {store.alerts.filter((a) => !a.isResolved).map((alert) => (
                      <div
                        key={alert.id}
                        className="surface-overlay p-4 flex items-start gap-3"
                      >
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            alert.severity === "critical" ? "text-[var(--color-primary,#ff1e42)]" : "text-amber-400"
                          }`}
                        />
                        <div className="flex-1">
                          <span className="text-xs font-medium text-[#fdfdfd] block mb-1">
                            {alert.title}
                          </span>
                          <p className="text-[11px] text-[#a3a3a3] leading-relaxed mb-3">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#737373]">{alert.timestamp}</span>
                            <button
                              onClick={() => store.resolveAlert(alert.id)}
                              className="text-[11px] font-medium text-[var(--color-primary,#ff1e42)] hover:underline min-h-[36px] flex items-center"
                            >
                              {t("resolve")}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Project Notes Panel ── */}
              <div className="surface-panel p-5 sm:p-6" data-testid="notes-panel">
                {/* Panel Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))] flex items-center justify-center text-[var(--color-primary,#ff1e42)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#fdfdfd]">{t("projectNotes")}</h3>
                      <p className="text-[10px] text-[#737373] font-mono">{store.notes.length} {t("notesCount")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsNotesPanelOpen((v) => !v)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd] hover:bg-white/[0.05] rounded-lg transition-colors"
                    aria-label="Toggle notes panel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-200 ${isNotesPanelOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>

                <AnimatePresence>
                  {isNotesPanelOpen && (
                    <m.div
                      key="notes-body"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {/* Note Cards */}
                      {store.notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-[#737373] text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 stroke-1 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          <p className="text-xs">{t("noNotesYet")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 mb-4">
                          {store.notes.some((n) => n.isPinned) && (
                            <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1 mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                              {t("pinnedNotes")}
                            </span>
                          )}
                          <AnimatePresence mode="popLayout">
                            {[...store.notes]
                              .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                              .map((note) => (
                                <m.div
                                  key={note.id}
                                  layout
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                                  data-testid={`note-card-${note.id}`}
                                  className={`surface-overlay p-3.5 rounded-lg border transition-all ${
                                    note.isPinned
                                      ? "border-amber-400/20 bg-amber-400/[0.03]"
                                      : "border-white/[0.06] hover:border-white/[0.12]"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {note.isPinned && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                                      )}
                                      <span className="text-xs font-semibold text-[#fdfdfd] truncate">{note.author}</span>
                                      {note.category && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[#a3a3a3] uppercase shrink-0">{note.category}</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono text-[#737373] shrink-0 tabular-nums">
                                      {new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#d4d4d4] leading-relaxed whitespace-pre-wrap mb-3">{note.content}</p>
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => store.togglePinNote(note.id)}
                                      data-testid={`pin-note-btn-${note.id}`}
                                      className="text-[10px] font-medium text-[#737373] hover:text-amber-400 transition-colors min-h-[28px] px-2 flex items-center gap-1 rounded hover:bg-amber-400/[0.08]"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill={note.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                                      {note.isPinned ? t("unpinNote") : t("pinNote")}
                                    </button>
                                    <button
                                      onClick={() => store.deleteNote(note.id)}
                                      data-testid={`delete-note-btn-${note.id}`}
                                      className="text-[10px] font-medium text-[#737373] hover:text-[var(--color-primary,#ff1e42)] transition-colors min-h-[28px] px-2 flex items-center gap-1 rounded hover:bg-[var(--accent-badge-bg,rgba(255,30,66,0.08))]"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                                      {t("deleteNote")}
                                    </button>
                                  </div>
                                </m.div>
                              ))}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Compose Area */}
                      <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2 text-[10px] text-[#a3a3a3]">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#737373]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span>{t("postingAs")}:</span>
                          <span className="font-medium text-[#fdfdfd]">{noteAuthor}</span>
                        </div>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={t("noteContentPlaceholder")}
                          rows={2}
                          className="w-full bg-[#161616] border border-white/[0.1] rounded-lg px-4 py-3 text-xs text-[#fdfdfd] placeholder:text-[#666666] focus:outline-none focus:border-[var(--color-primary,#ff1e42)] transition-colors resize-none"
                          data-testid="note-compose-input"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              if (noteText.trim()) { store.addNote(noteText, noteAuthor); setNoteText(""); }
                            }
                          }}
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!noteText.trim()) return;
                              store.addNote(noteText, noteAuthor);
                              setNoteText("");
                            }}
                            disabled={!noteText.trim()}
                            className="btn-primary-crimson text-xs px-4 min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            data-testid="add-note-btn"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                            {t("addNote")}
                          </button>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TRANSACTIONS & PETTY CASH LEDGER */}
          {/* ========================================================================= */}
          {activeTab === "transactions" && (
            <div className="space-y-6 animate-fade-in">
              {/* Action Bar & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]" />
                    <input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#121212] border border-white/[0.08] rounded-full pl-10 pr-4 min-h-[44px] text-xs text-[#fdfdfd] placeholder-[#737373] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                    />
                  </div>

                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="bg-[#121212] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  >
                    <option value="all">{t("filterAll")}</option>
                    {store.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={store.exportLedgerCSV}
                    className="btn-ghost-pill text-xs min-h-[44px] px-4 flex items-center gap-2 text-[#a3a3a3] hover:text-white"
                    title="Export to CSV (Excel / Sheets)"
                  >
                    <FileDown className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                    <span>{t("exportCSV")}</span>
                  </button>

                  <button
                    onClick={openLogModal}
                    className="btn-primary-crimson text-xs min-h-[44px] px-5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("logExpense")}</span>
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="surface-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[#737373] uppercase tracking-wider text-[10px]">
                        <th className="p-4">{t("colTx")}</th>
                        <th className="p-4">{t("colVendor")}</th>
                        <th className="p-4">{t("colDept")}</th>
                        <th className="p-4">{t("colPocket")}</th>
                        <th className="p-4">{t("colAmount")}</th>
                        <th className="p-4">{t("colReceipt")}</th>
                        <th className="p-4">{t("colStatus")}</th>
                        <th className="p-4 text-right">{t("colActions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono text-[#737373]">{tx.id}</td>
                          <td className="p-4">
                            <div className="font-medium text-[#fdfdfd]">{tx.description}</div>
                            <div className="text-[11px] text-[#737373] mt-0.5">{tx.vendor} • {tx.loggedAt}</div>
                            {tx.isMissingReceipt && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-primary,#ff1e42)] font-semibold mt-1">
                                <AlertTriangle className="w-3 h-3" /> Missing Receipt Photo
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-[#a3a3a3]">{tx.departmentName}</td>
                          <td className="p-4 font-mono text-[11px] text-[#737373]">{tx.pocketName}</td>
                          <td className="p-4 font-mono font-medium text-[#fdfdfd]">
                            {formatMoney(tx.amount)}
                          </td>
                          <td className="p-4">
                            {tx.receiptUrl && !tx.isMissingReceipt ? (
                              <button
                                onClick={() => setPreviewReceiptTx(tx)}
                                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-white/[0.08] hover:border-[var(--color-primary,#ff1e42)] transition-all text-[10px] text-[#d4d4d4]"
                                title="Click to view receipt in lightbox"
                              >
                                <Camera className="w-3 h-3 text-[var(--color-primary,#ff1e42)] group-hover:scale-110 transition-transform" />
                                <span>View Photo</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#737373] font-mono italic">No Attachment</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase ${
                                tx.status === "approved"
                                  ? "bg-[#10b981]/15 text-[#10b981] font-semibold"
                                  : tx.status === "rejected"
                                  ? "bg-[var(--color-primary,#ff1e42)]/15 text-[var(--color-primary,#ff1e42)] font-semibold"
                                  : "bg-amber-400/15 text-amber-400 font-semibold"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              {tx.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => store.updateTransactionStatus(tx.id, "approved")}
                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#10b981] hover:bg-white/[0.05] rounded-full"
                                    title="Approve Transaction"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => store.updateTransactionStatus(tx.id, "rejected")}
                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-primary,#ff1e42)] hover:bg-white/[0.05] rounded-full"
                                    title="Reject Transaction (Refunds Pocket)"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              {(() => {
                                const commentCount = store.comments.filter((c) => c.entityId === tx.id).length;
                                return (
                                  <button
                                    onClick={() =>
                                      setActiveCommentEntity(
                                        activeCommentEntity?.id === tx.id
                                          ? null
                                          : { id: tx.id, title: `${tx.description} (${formatMoney(tx.amount)})` }
                                      )
                                    }
                                    className={`min-h-[44px] min-w-[44px] px-2 flex items-center justify-center gap-1.5 rounded-full transition-colors relative ${
                                      commentCount > 0
                                        ? "text-[var(--color-primary,#ff1e42)] bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))] hover:bg-[var(--accent-badge-bg,rgba(255,30,66,0.2))]"
                                        : "text-[#737373] hover:text-[#fdfdfd] hover:bg-white/[0.05]"
                                    }`}
                                    title="Context Discussion"
                                    data-testid={`tx-comment-btn-${tx.id}`}
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    {commentCount > 0 && (
                                      <span
                                        className="text-[10px] font-mono font-bold leading-none px-1 py-0.5 rounded bg-[var(--color-primary,#ff1e42)] text-white"
                                        data-testid={`tx-comment-count-${tx.id}`}
                                      >
                                        {commentCount}
                                      </span>
                                    )}
                                  </button>
                                );
                              })()}
                              <button
                                onClick={() => store.deleteTransaction(tx.id)}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[var(--color-primary,#ff1e42)] hover:bg-white/[0.05] rounded-full"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MULTI-POCKET CASHFLOW */}
          {/* ========================================================================= */}
          {activeTab === "pockets" && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium text-[#fdfdfd]">{t("pocketsTitle")}</h2>
                  <p className="text-xs text-[#737373] mt-0.5">{t("pocketsSub")}</p>
                </div>
                <button
                  onClick={openTransferModal}
                  className="btn-primary-crimson text-xs min-h-[44px] px-5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{t("transferFunds")}</span>
                </button>
              </div>

              {/* Hierarchy Tree Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {store.pockets.map((pocket, idx) => (
                  <div key={pocket.id} className="surface-panel p-5 sm:p-6 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono text-[var(--color-primary,#ff1e42)] bg-[var(--color-primary,#ff1e42)]/10 px-2.5 py-1 rounded-full uppercase">
                          Tier {idx + 1} • {pocket.type.replace("_", " ")}
                        </span>
                        <WalletCards className="w-4 h-4 text-[#737373]" />
                      </div>

                      <h3 className="text-base font-medium text-[#fdfdfd] mb-1">{pocket.name}</h3>
                      <span className="text-xs text-[#a3a3a3] block mb-4">
                        {t("custodian")}: {pocket.custodian}
                      </span>

                      <div className="surface-overlay p-4 mb-4">
                        <span className="text-xs text-[#737373] block mb-1">{t("remainingBalance")}</span>
                        <span className="text-2xl font-mono font-medium text-[#fdfdfd]">
                          {formatMoney(pocket.balance)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#737373]">
                      <span>{t("totalAllocated")}: {formatMoney(pocket.allocated)}</span>
                      <span className="text-[#10b981] font-medium">Audited & Active</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transfer Audit Log Table */}
              <div className="surface-panel p-5 sm:p-6">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-medium text-[#fdfdfd]">{t("transferHistory")}</h3>
                  <span className="text-xs text-[#737373] font-mono">{store.transfers.length} Transactions</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[#737373] uppercase tracking-wider text-[10px]">
                        <th className="p-3">Ref</th>
                        <th className="p-3">From Source</th>
                        <th className="p-3">To Destination</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Authorized By</th>
                        <th className="p-3">Time</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {store.transfers.map((tr) => (
                        <tr key={tr.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-mono text-[#737373]">{tr.id}</td>
                          <td className="p-3 text-[#fdfdfd] font-medium">{tr.sourcePocketName}</td>
                          <td className="p-3 text-[#10b981] font-medium">{tr.destPocketName}</td>
                          <td className="p-3 font-mono font-semibold text-[#fdfdfd]">
                            {formatMoney(tr.amount)}
                          </td>
                          <td className="p-3 text-[#a3a3a3]">{tr.authorizedBy}</td>
                          <td className="p-3 text-[#737373]">{tr.timestamp}</td>
                          <td className="p-3 text-[#737373] italic">{tr.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DEPARTMENT TASKS */}
          {/* ========================================================================= */}
          {activeTab === "tasks" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium text-[#fdfdfd]">{t("tasksTitle")}</h2>
                  <p className="text-xs text-[#737373] mt-0.5">{t("tasksSub")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={taskDeptFilter}
                    onChange={(e) => setTaskDeptFilter(e.target.value)}
                    className="bg-[#121212] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  >
                    <option value="all">All Departments</option>
                    {store.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={openTaskModal}
                    className="btn-primary-crimson text-xs min-h-[44px] px-5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("newTask")}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {/* Column 1: To Do */}
                <div className="surface-panel p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs uppercase tracking-wider text-[#737373] font-medium">{t("todo")}</span>
                    <span className="text-xs font-mono text-[#a3a3a3]">
                      {filteredTasks.filter((t) => t.status === "todo").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {filteredTasks
                      .filter((t) => t.status === "todo")
                      .map((task) => (
                        <div
                          key={task.id}
                          data-testid={`task-card-${task.id}`}
                          className="surface-overlay p-4 hover:border-white/[0.15] transition-all relative group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-[#737373]">{task.departmentName}</span>
                            <span className="text-[10px] font-mono text-[var(--color-primary,#ff1e42)] uppercase font-semibold">
                              {task.priority}
                            </span>
                          </div>
                          <span
                            onClick={() => store.toggleTask(task.id)}
                            className="text-xs font-medium text-[#fdfdfd] block mb-2 cursor-pointer hover:underline"
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center justify-between text-[11px] text-[#737373]">
                            <span>{task.assignee}</span>
                            <div className="flex items-center gap-2">
                              <span>{task.dueDate}</span>
                              {(() => {
                                const count = store.comments.filter((c) => c.entityId === task.id).length;
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveCommentEntity(
                                        activeCommentEntity?.id === task.id
                                          ? null
                                          : { id: task.id, title: `Task: ${task.title}` }
                                      );
                                    }}
                                    className={`p-1 rounded flex items-center gap-1 transition-colors ${
                                      count > 0
                                        ? "text-[var(--color-primary,#ff1e42)] bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))]"
                                        : "text-[#737373] hover:text-[#fdfdfd] hover:bg-white/[0.05]"
                                    }`}
                                    title="Task Discussion"
                                    data-testid={`task-comment-btn-${task.id}`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {count > 0 && (
                                      <span
                                        className="text-[9px] font-mono font-bold leading-none px-1 py-0.5 rounded bg-[var(--color-primary,#ff1e42)] text-white"
                                        data-testid={`task-comment-count-${task.id}`}
                                      >
                                        {count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })()}
                              <button
                                onClick={() => store.deleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-[#737373] hover:text-[var(--color-primary,#ff1e42)] transition-opacity"
                                title="Delete task"
                                data-testid={`task-delete-btn-${task.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="surface-panel p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs uppercase tracking-wider text-amber-400 font-medium">{t("inProgress")}</span>
                    <span className="text-xs font-mono text-[#a3a3a3]">
                      {filteredTasks.filter((t) => t.status === "in_progress").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {filteredTasks
                      .filter((t) => t.status === "in_progress")
                      .map((task) => (
                        <div
                          key={task.id}
                          data-testid={`task-card-${task.id}`}
                          className="surface-overlay p-4 hover:border-white/[0.15] transition-all relative group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-[#737373]">{task.departmentName}</span>
                            <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                              {task.priority}
                            </span>
                          </div>
                          <span
                            onClick={() => store.toggleTask(task.id)}
                            className="text-xs font-medium text-[#fdfdfd] block mb-2 cursor-pointer hover:underline"
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center justify-between text-[11px] text-[#737373]">
                            <span>{task.assignee}</span>
                            <div className="flex items-center gap-2">
                              <span>{task.dueDate}</span>
                              {(() => {
                                const count = store.comments.filter((c) => c.entityId === task.id).length;
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveCommentEntity(
                                        activeCommentEntity?.id === task.id
                                          ? null
                                          : { id: task.id, title: `Task: ${task.title}` }
                                      );
                                    }}
                                    className={`p-1 rounded flex items-center gap-1 transition-colors ${
                                      count > 0
                                        ? "text-[var(--color-primary,#ff1e42)] bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))]"
                                        : "text-[#737373] hover:text-[#fdfdfd] hover:bg-white/[0.05]"
                                    }`}
                                    title="Task Discussion"
                                    data-testid={`task-comment-btn-${task.id}`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {count > 0 && (
                                      <span
                                        className="text-[9px] font-mono font-bold leading-none px-1 py-0.5 rounded bg-[var(--color-primary,#ff1e42)] text-white"
                                        data-testid={`task-comment-count-${task.id}`}
                                      >
                                        {count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })()}
                              <button
                                onClick={() => store.deleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-[#737373] hover:text-[var(--color-primary,#ff1e42)] transition-opacity"
                                title="Delete task"
                                data-testid={`task-delete-btn-${task.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Column 3: Completed */}
                <div className="surface-panel p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs uppercase tracking-wider text-[#10b981] font-medium">{t("completed")}</span>
                    <span className="text-xs font-mono text-[#a3a3a3]">
                      {filteredTasks.filter((t) => t.status === "completed").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {filteredTasks
                      .filter((t) => t.status === "completed")
                      .map((task) => (
                        <div
                          key={task.id}
                          data-testid={`task-card-${task.id}`}
                          className="surface-overlay p-4 opacity-60 hover:opacity-100 transition-all relative group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-[#737373]">{task.departmentName}</span>
                            <span className="text-[10px] font-mono text-[#10b981] font-semibold">Done</span>
                          </div>
                          <span
                            onClick={() => store.toggleTask(task.id)}
                            className="text-xs font-medium text-[#fdfdfd] block mb-2 line-through cursor-pointer"
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center justify-between text-[11px] text-[#737373]">
                            <span>{task.assignee}</span>
                            <div className="flex items-center gap-2">
                              <span>{task.dueDate}</span>
                              {(() => {
                                const count = store.comments.filter((c) => c.entityId === task.id).length;
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveCommentEntity(
                                        activeCommentEntity?.id === task.id
                                          ? null
                                          : { id: task.id, title: `Task: ${task.title}` }
                                      );
                                    }}
                                    className={`p-1 rounded flex items-center gap-1 transition-colors ${
                                      count > 0
                                        ? "text-[var(--color-primary,#ff1e42)] bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))]"
                                        : "text-[#737373] hover:text-[#fdfdfd] hover:bg-white/[0.05]"
                                    }`}
                                    title="Task Discussion"
                                    data-testid={`task-comment-btn-${task.id}`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {count > 0 && (
                                      <span
                                        className="text-[9px] font-mono font-bold leading-none px-1 py-0.5 rounded bg-[var(--color-primary,#ff1e42)] text-white"
                                        data-testid={`task-comment-count-${task.id}`}
                                      >
                                        {count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })()}
                              <button
                                onClick={() => store.deleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-[#737373] hover:text-[var(--color-primary,#ff1e42)] transition-opacity"
                                title="Delete task"
                                data-testid={`task-delete-btn-${task.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: DIGITAL CALL SHEET */}
          {/* ========================================================================= */}
          {activeTab === "callsheet" && (
            <div className="space-y-6 max-w-4xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium text-[#fdfdfd]">{t("callSheetTitle")}</h2>
                  <p className="text-xs text-[#737373] mt-0.5">{t("callSheetSub")}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsCallSheetModalOpen(true)}
                    className="btn-ghost-pill text-xs min-h-[44px] px-4 flex items-center gap-2 text-[#d4d4d4]"
                  >
                    <Edit3 className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                    <span>{t("editCallSheet")}</span>
                  </button>

                  <button
                    onClick={store.advanceShootDay}
                    className="btn-primary-crimson text-xs min-h-[44px] px-4 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{t("advanceDay")}</span>
                  </button>
                </div>
              </div>

              <div className="surface-panel p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-white/[0.06] gap-4">
                  <div>
                    <span className="text-xs font-mono text-[var(--color-primary,#ff1e42)] uppercase tracking-wider block mb-1 font-semibold">
                      Day {store.callSheet.dayNumber} of {store.callSheet.totalDays}
                    </span>
                    <h2 className="text-2xl font-medium text-[#fdfdfd]">{store.callSheet.date}</h2>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs text-[#737373] block">{t("callTime")}</span>
                    <span className="text-2xl font-mono font-medium text-[var(--color-primary,#ff1e42)]">
                      {store.callSheet.callTime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-6">
                  <div className="surface-overlay p-4">
                    <span className="text-xs text-[#737373] flex items-center gap-1.5 mb-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)]" /> {t("location")}
                    </span>
                    <span className="text-sm font-medium text-[#fdfdfd] block mb-1">
                      {store.callSheet.locationName}
                    </span>
                    <span className="text-xs text-[#a3a3a3]">{store.callSheet.locationAddress}</span>
                  </div>

                  <div className="surface-overlay p-4">
                    <span className="text-xs text-[#737373] flex items-center gap-1.5 mb-1.5 font-medium">
                      <CloudRain className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)]" /> {t("weather")} & {t("estimatedWrap")}
                    </span>
                    <span className="text-sm font-medium text-[#fdfdfd] block mb-1">
                      {t("estimatedWrap")}: {store.callSheet.estimatedWrap}
                    </span>
                    <span className="text-xs text-[#a3a3a3]">{store.callSheet.weather}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-[14px] bg-[#121212] border border-white/[0.06]">
                    <span className="text-xs text-[#737373] block mb-1 font-medium">Scheduled Scenes</span>
                    <span className="text-xs font-mono text-[#fdfdfd]">{store.callSheet.scenesScheduled}</span>
                  </div>

                  <div className="p-4 rounded-[14px] bg-[#121212] border border-white/[0.06]">
                    <span className="text-xs text-[#737373] block mb-1 font-medium">{t("directorNotes")}</span>
                    <p className="text-xs text-[#a3a3a3] leading-relaxed">{store.callSheet.directorNotes}</p>
                  </div>

                  <div className="p-4 rounded-[14px] bg-[#121212] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-[#737373] flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)]" /> {t("emergencyContact")}
                    </span>
                    <span className="text-xs font-mono text-[#fdfdfd]">{store.callSheet.emergencyContact}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: EQUIPMENT RENTAL TRACKER */}
          {/* ========================================================================= */}
          {activeTab === "equipment" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium text-[#fdfdfd]">{t("tabEquipment")}</h2>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Prevent penalty fees with automatic return countdowns and gear status logs.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-full surface-overlay border border-white/[0.08] text-xs">
                    <span className="text-[#737373] mr-1.5">{t("totalEquipmentBurn")}:</span>
                    <span className="font-mono font-medium text-[var(--color-primary,#ff1e42)]">
                      {formatMoney(totalDailyEquipmentBurn)}/day
                    </span>
                  </div>

                  <button
                    onClick={() => setIsEquipmentModalOpen(true)}
                    className="btn-primary-crimson text-xs min-h-[44px] px-5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("addEquipment")}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {store.equipment.map((eq) => (
                  <div key={eq.id} className="surface-panel p-5 sm:p-6 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#737373] uppercase">{eq.department}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase ${
                              eq.status === "returned"
                                ? "bg-[#10b981]/15 text-[#10b981]"
                                : eq.status === "damaged"
                                ? "bg-red-600/20 text-red-400 font-bold"
                                : eq.daysRemaining <= 2
                                ? "bg-[var(--color-primary,#ff1e42)]/15 text-[var(--color-primary,#ff1e42)] font-bold"
                                : "bg-[#10b981]/15 text-[#10b981] font-semibold"
                            }`}
                          >
                            {eq.status === "returned"
                              ? t("statusReturned")
                              : eq.status === "damaged"
                              ? t("statusDamaged")
                              : `${eq.daysRemaining} Days Left`}
                          </span>

                          <button
                            onClick={() => store.deleteEquipment(eq.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#737373] hover:text-[var(--color-primary,#ff1e42)] transition-opacity"
                            title="Delete equipment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-medium text-[#fdfdfd] mb-1">{eq.itemName}</h3>
                      <span className="text-xs text-[#a3a3a3] block mb-4">Vendor: {eq.vendor}</span>
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#737373]">Due: {eq.returnDate}</span>
                        <span>•</span>
                        <span className="font-mono font-medium text-[#fdfdfd]">{formatMoney(eq.dailyRate)}/day</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            store.updateEquipmentStatus(
                              eq.id,
                              eq.status === "returned" ? "on_set" : "returned"
                            )
                          }
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                            eq.status === "returned"
                              ? "border-[#10b981] text-[#10b981]"
                              : "border-white/[0.08] text-[#a3a3a3] hover:text-white"
                          }`}
                        >
                          {eq.status === "returned" ? "Mark On-Set" : t("markReturned")}
                        </button>
                        <button
                          onClick={() =>
                            store.updateEquipmentStatus(
                              eq.id,
                              eq.status === "damaged" ? "on_set" : "damaged"
                            )
                          }
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                            eq.status === "damaged"
                              ? "border-red-500 text-red-400 font-bold"
                              : "border-white/[0.08] text-[#a3a3a3] hover:text-red-400"
                          }`}
                        >
                          {eq.status === "damaged" ? "Repaired" : t("markDamaged")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: AUTOMATED ALERTS */}
          {/* ========================================================================= */}
          {activeTab === "alerts" && (
            <div className="space-y-6 max-w-3xl animate-fade-in">
              <div>
                <h2 className="text-xl font-medium text-[#fdfdfd]">{t("tabAlerts")}</h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Scheduled cron alerts detecting anomalies, missing receipts, and budget overruns.
                </p>
              </div>

              <div className="space-y-3" data-testid="alerts-container">
                {store.alerts.map((alert) => {
                  const isCrit = alert.severity === "critical";
                  const isWarn = alert.severity === "warning";
                  return (
                    <div
                      key={alert.id}
                      data-testid={`alert-card-${alert.id}`}
                      data-severity={alert.severity}
                      data-resolved={alert.isResolved ? "true" : "false"}
                      className={`surface-panel p-5 flex items-start gap-4 transition-all border ${
                        alert.isResolved
                          ? "opacity-40 border-white/[0.04]"
                          : isCrit
                          ? "border-[var(--color-primary,#ff1e42)]/40 bg-[var(--color-primary,#ff1e42)]/[0.03]"
                          : isWarn
                          ? "border-amber-500/40 bg-amber-500/[0.03]"
                          : "border-sky-500/40 bg-sky-500/[0.03]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isCrit
                            ? "bg-[var(--color-primary,#ff1e42)]/15 text-[var(--color-primary,#ff1e42)]"
                            : isWarn
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-sky-500/15 text-sky-400"
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-sm font-semibold text-[#fdfdfd] truncate">{alert.title}</h3>
                            <span
                              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                isCrit
                                  ? "bg-[var(--color-primary,#ff1e42)] text-white"
                                  : isWarn
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#737373] shrink-0">{alert.timestamp}</span>
                        </div>
                        <p className="text-xs text-[#a3a3a3] leading-relaxed mb-3">{alert.message}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                          <span className="text-[10px] font-mono uppercase text-[#737373]">
                            Type: {alert.type.replace(/_/g, " ")}
                          </span>
                          {!alert.isResolved ? (
                            <button
                              onClick={() => store.resolveAlert(alert.id)}
                              className="btn-ghost-pill text-xs min-h-[38px] px-3.5 text-[var(--color-primary,#ff1e42)] border-[var(--color-primary,#ff1e42)]/30 hover:bg-[var(--color-primary,#ff1e42)]/10"
                              data-testid={`resolve-alert-btn-${alert.id}`}
                            >
                              {t("acknowledgeResolve")}
                            </button>
                          ) : (
                            <span className="text-xs text-[#10b981] flex items-center gap-1.5 font-mono font-medium">
                              <CheckCircle2 className="w-4 h-4" /> {t("resolved")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: GOOGLE SHEET MIRROR & DATA SOVEREIGNTY */}
          {/* ========================================================================= */}
          {activeTab === "sync" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium text-[#fdfdfd]">{t("tabSheet")}</h2>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Data Sovereignty Guarantee: Direct BYOS mirroring to your personal Google Drive & Sheets with offline JSON backup.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="btn-ghost-pill text-xs min-h-[44px] px-3.5 flex items-center gap-2 text-[#d4d4d4]"
                    title={t("printWrapReport")}
                  >
                    <Printer className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                    <span>Print Wrap (PDF)</span>
                  </button>

                  <button
                    onClick={store.exportLedgerCSV}
                    className="btn-ghost-pill text-xs min-h-[44px] px-3.5 flex items-center gap-2 text-[#d4d4d4]"
                  >
                    <Download className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                    <span>{t("exportCSV")}</span>
                  </button>

                  <button
                    onClick={store.exportProductionVaultJSON}
                    className="btn-primary-crimson text-xs min-h-[44px] px-4 flex items-center gap-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{t("downloadVault")}</span>
                  </button>
                </div>
              </div>

              {/* 1. Real Google Apps Script Webhook Bridge Card */}
              <div className="surface-panel p-6 border border-white/[0.08] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary,#ff1e42)]/10 border border-[var(--color-primary,#ff1e42)]/20 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Google Apps Script Webhook Connector</h3>
                      <p className="text-[11px] text-[#737373]">
                        Stream ledger records automatically into your Google Sheet with 0 server fees.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#a3a3a3] cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={store.isWebhookSyncEnabled}
                        onChange={(e) => store.persistWebhookConfig(tempWebhookUrl, e.target.checked)}
                        className="rounded border-white/[0.2] bg-[#121212] text-[var(--color-primary,#ff1e42)] focus:ring-0"
                      />
                      <span className="text-xs font-medium text-white">{t("webhookSyncToggle")}</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={tempWebhookUrl}
                    onChange={(e) => setTempWebhookUrl(e.target.value)}
                    className="flex-1 bg-[#121212] border border-white/[0.08] rounded-xl px-4 min-h-[44px] text-xs text-[#fdfdfd] placeholder-[#737373] focus:outline-none focus:border-[var(--color-primary,#ff1e42)] font-mono"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => store.persistWebhookConfig(tempWebhookUrl, store.isWebhookSyncEnabled)}
                      className="btn-ghost-pill text-xs min-h-[44px] px-4 text-white"
                    >
                      {t("saveWebhook")}
                    </button>

                    <button
                      onClick={handleTestWebhook}
                      disabled={isTestingWebhook}
                      className="btn-ghost-pill text-xs min-h-[44px] px-4 text-[var(--color-primary,#ff1e42)] border-[var(--color-primary,#ff1e42)]/30 hover:border-[var(--color-primary,#ff1e42)]"
                    >
                      {isTestingWebhook ? "Pinging..." : t("testWebhook")}
                    </button>

                    <button
                      onClick={handleBulkSync}
                      disabled={isTestingWebhook}
                      className="btn-primary-crimson text-xs min-h-[44px] px-4"
                    >
                      {t("syncAllToSheets")}
                    </button>
                  </div>
                </div>

                {webhookSyncStatus && (
                  <div className="surface-overlay px-4 py-2 text-xs font-mono text-[#a3a3a3] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary,#ff1e42)]" />
                    <span>{webhookSyncStatus}</span>
                  </div>
                )}

                {/* Apps Script Template Accordion / Box */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setShowAppsScriptCode(!showAppsScriptCode)}
                      className="text-xs text-[#a3a3a3] hover:text-white flex items-center gap-1.5 font-medium"
                    >
                      <Code className="w-3.5 h-3.5 text-[var(--color-primary,#ff1e42)]" />
                      <span>{showAppsScriptCode ? "Hide Apps Script Setup Guide" : "Show Google Apps Script Setup Code (60s Setup)"}</span>
                    </button>

                    <button
                      onClick={copyScriptCode}
                      className="text-xs px-3 py-1 rounded-full border border-white/[0.1] hover:border-white/[0.3] text-white flex items-center gap-1.5 transition-all"
                    >
                      {isCopiedAppsScript ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{t("appsScriptCopied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#737373]" />
                          <span>{t("copyAppsScript")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {showAppsScriptCode && (
                    <div className="surface-overlay p-4 rounded-xl font-mono text-[11px] text-[#a3a3a3] overflow-x-auto space-y-2 mt-3">
                      <div className="text-white font-semibold mb-2">
                        Instructions: Open your Google Sheet &gt; Extensions &gt; Apps Script &gt; Paste code below &gt; Deploy as Web App (Access: Anyone) &gt; Paste URL above.
                      </div>
                      <pre className="text-[#e5e5e5] whitespace-pre leading-relaxed">{APPS_SCRIPT_TEMPLATE}</pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="surface-panel p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <HardDrive className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                    <h3 className="text-sm font-medium text-[#fdfdfd]">Google Drive Folder Tree</h3>
                  </div>
                  <div className="surface-overlay p-3.5 font-mono text-xs text-[#a3a3a3] space-y-1.5">
                    <div className="text-white font-medium">📁 ClosedBook_TheQuietHorizon/</div>
                    <div className="pl-4">📁 01_Petty_Cash_Receipts/ ({store.transactions.length} files)</div>
                    <div className="pl-4">📁 02_Daily_Call_Sheets/ (Day 1-{store.callSheet.dayNumber})</div>
                    <div className="pl-4">📁 03_Deal_Memos_Talent/ (28 signed)</div>
                    <div className="pl-4">📁 04_Rental_Equipment_POs/ ({store.equipment.length} items)</div>
                  </div>
                </div>

                <div className="surface-panel p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileSpreadsheet className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                    <h3 className="text-sm font-medium text-[#fdfdfd]">Google Sheet Ledger Status</h3>
                  </div>
                  <div className="surface-overlay p-3.5 font-mono text-xs text-[#a3a3a3] space-y-1.5">
                    <div className="text-white font-medium">📊 Master_Shooting_Ledger.xlsx</div>
                    <div>Sheet: &apos;Cashflow_Day_{store.callSheet.dayNumber}&apos;</div>
                    <div>Row Count: {store.transactions.length + 1} rows</div>
                    <div className="text-[#10b981] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                      Status: {store.isWebhookSyncEnabled && store.webhookUrl ? "Live Webhook Connected" : "Local Vault Stream Synced"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Backup Card */}
              <div className="surface-panel p-6 border border-white/[0.08]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Zero-Vendor-Lock-in Guarantee</h3>
                    <p className="text-xs text-[#a3a3a3] leading-relaxed max-w-xl">
                      Your production records never depend on ClosedBook remaining online. Download your complete encrypted JSON database package or raw CSV ledger anytime for offline accounting and archival.
                    </p>
                  </div>
                  <button
                    onClick={store.exportProductionVaultJSON}
                    className="btn-ghost-pill text-xs min-h-[44px] px-5 text-white border-white/[0.15] hover:border-[var(--color-primary,#ff1e42)] shrink-0"
                  >
                    Export Offline Vault
                  </button>
                </div>
              </div>
            </div>
          )}
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070707]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "overview" ? "text-[var(--color-primary,#ff1e42)]" : "text-[#737373]"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "transactions" ? "text-[var(--color-primary,#ff1e42)]" : "text-[#737373]"
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Ledger</span>
        </button>

        {/* Mobile Quick Log FAB */}
        <button
          onClick={openLogModal}
          className="w-12 h-12 rounded-full bg-[var(--color-primary,#ff1e42)] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,30,66,0.4)] -mt-4 shrink-0 transition-transform active:scale-95"
          title="Quick Log Petty Cash"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "tasks" ? "text-[var(--color-primary,#ff1e42)]" : "text-[#737373]"
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Tasks</span>
        </button>

        <button
          onClick={() => setActiveTab("callsheet")}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "callsheet" ? "text-[var(--color-primary,#ff1e42)]" : "text-[#737373]"
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab("reconcile")}
          className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "reconcile" ? "text-[var(--color-primary,#ff1e42)]" : "text-[#737373]"
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Reconcile</span>
          {store.reconciliations.filter(r => r.dayNumber === store.callSheet.dayNumber).length === 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f59e0b]" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LOG PETTY CASH (With Client-Side Photo Compression & EXIF Strip) */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
          <div className="surface-panel w-full sm:max-w-lg rounded-t-[20px] sm:rounded-[14px] p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[var(--color-primary,#ff1e42)]" />
                <h3 className="text-sm font-medium text-[#fdfdfd]">{t("modalExpenseTitle")}</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* AI RECEIPT SCANNER ACTION CARD */}
              <div className="p-3.5 rounded-[16px] bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/[0.08] relative overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary,#ff1e42)]/15 border border-[var(--color-primary,#ff1e42)]/30 flex items-center justify-center text-[var(--color-primary,#ff1e42)] shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#fdfdfd] truncate">
                          {t("scanReceiptAi")}
                        </span>
                        {!geminiApiKey && (
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                            BYOK
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#737373] truncate mt-0.5 font-mono">
                        {geminiApiKey ? "Gemini 1.5 Flash Vision Active" : "Requires free Gemini key"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-scan-receipt-ai"
                    onClick={handleTriggerAiScan}
                    disabled={isOcrScanning}
                    className="btn-primary-crimson text-xs min-h-[38px] px-3.5 flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isOcrScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t("scanReceiptAi")}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hidden file input for OCR */}
                <input
                  ref={ocrFileInputRef}
                  id="ocr-receipt-file-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAiReceiptFileChange}
                  className="hidden"
                />

                {/* Non-blocking Guidance Popover/Banner when key is missing */}
                {showOcrNoKeyGuidance && !geminiApiKey && (
                  <div
                    id="ocr-no-key-guidance"
                    className="mt-3 p-3 rounded-xl bg-[#121212] border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{t("ocrKeyRequiredTitle")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOcrNoKeyGuidance(false)}
                        className="text-[#737373] hover:text-[#fdfdfd] p-0.5"
                        aria-label="Dismiss guidance"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#a3a3a3] leading-relaxed">
                      {t("ocrKeyRequiredDesc")}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        id="btn-open-pref-from-ocr"
                        onClick={() => {
                          setIsLogModalOpen(false);
                          setIsSettingsOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-primary,#ff1e42)] text-white text-[11px] font-medium hover:opacity-90 transition-opacity"
                      >
                        {t("openPreferences")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOcrNoKeyGuidance(false)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-[#a3a3a3] hover:text-white text-[11px] transition-colors"
                      >
                        {t("continueManual")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Scanning in progress banner */}
                {isOcrScanning && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[var(--color-primary,#ff1e42)]/10 border border-[var(--color-primary,#ff1e42)]/20 text-xs flex items-center gap-2 text-[var(--color-primary,#ff1e42)] animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{t("scanningAi")}</span>
                  </div>
                )}

                {/* OCR Error Banner */}
                {ocrError && (
                  <div id="ocr-error-banner" className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs flex items-start gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block">{ocrError}</span>
                      <span className="text-[10px] text-red-400/80 mt-0.5 block">You can continue logging manually below.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOcrError(null)}
                      className="text-red-400 hover:text-white p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* OCR Success Toast */}
                {ocrSuccessToast && (
                  <div id="ocr-success-banner" className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-2 text-emerald-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{ocrSuccessToast}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOcrSuccessToast(null)}
                      className="text-emerald-400 hover:text-white p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("formDesc")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Generator Diesel (100L)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">
                    {t("formAmount")} ({currencies[currency].symbol} {currencies[currency].code})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={currency === "IDR" ? "e.g. 3500000" : currency === "JPY" ? "e.g. 50000" : "e.g. 240.00"}
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">{t("formVendor")}</label>
                  <input
                    type="text"
                    placeholder="e.g. Marina Gas Station"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">{t("formDept")}</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  >
                    {store.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">{t("formPocket")}</label>
                  <select
                    value={newPocket}
                    onChange={(e) => setNewPocket(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  >
                    {store.pockets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatMoney(p.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client-side Receipt Photo Uploader & Compressor */}
              <div className="p-4 rounded-[14px] bg-[#181818] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                    <span className="text-xs text-[#fdfdfd] font-medium">{t("formAttachReceipt")}</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#a3a3a3] cursor-pointer min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={missingReceiptCheck}
                      onChange={(e) => {
                        setMissingReceiptCheck(e.target.checked);
                        if (e.target.checked) {
                          setReceiptDataUrl(null);
                          setReceiptSizeKb(null);
                        }
                      }}
                      className="w-4 h-4 accent-[var(--color-primary,#ff1e42)]"
                    />
                    <span>{t("filterMissing")}</span>
                  </label>
                </div>

                {!missingReceiptCheck && (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center border border-dashed border-white/[0.15] hover:border-[var(--color-primary,#ff1e42)] rounded-[12px] p-3 text-center cursor-pointer transition-colors bg-white/[0.01]">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleReceiptFileChange}
                        className="hidden"
                      />
                      <UploadCloud className="w-5 h-5 text-[#737373] mb-1" />
                      <span className="text-[11px] text-[#d4d4d4] font-medium">
                        {isCompressing ? "Compressing & stripping EXIF..." : t("dropOrCaptureReceipt")}
                      </span>
                    </label>

                    {receiptDataUrl && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#121212] border border-white/[0.06] text-xs">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={receiptDataUrl} alt="Thumbnail" className="w-8 h-8 rounded object-cover border border-white/[0.1]" />
                          <div>
                            <span className="text-[11px] text-[#fdfdfd] block font-medium">Compressed JPEG</span>
                            <span className="text-[10px] text-[#10b981] font-mono font-medium">
                              ~{receiptSizeKb} KB • EXIF Stripped
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptDataUrl(null);
                            setReceiptSizeKb(null);
                          }}
                          className="text-xs text-[#737373] hover:text-[var(--color-primary,#ff1e42)]"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full btn-primary-crimson text-xs min-h-[48px] font-medium">
                {t("formSubmitExpense")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TRANSFER POCKET FUNDS (With Strict Overdraft Guard) */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
          <div className="surface-panel w-full sm:max-w-md rounded-t-[20px] sm:rounded-[14px] p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <WalletCards className="w-5 h-5 text-[var(--color-primary,#ff1e42)]" />
                <h3 className="text-sm font-medium text-[#fdfdfd]">{t("modalTransferTitle")}</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-primary,#ff1e42)]/15 border border-[var(--color-primary,#ff1e42)]/30 text-xs text-[var(--color-primary,#ff1e42)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("selectSourcePocket")}</label>
                <select
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                >
                  {store.pockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Balance: {formatMoney(p.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("selectDestPocket")}</label>
                <select
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                >
                  {store.pockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Balance: {formatMoney(p.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">
                  Transfer Amount ({currencies[currency].symbol} {currencies[currency].code})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={currency === "IDR" ? "e.g. 50000000" : currency === "JPY" ? "e.g. 450000" : "e.g. 5000.00"}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Authorization Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Location transport reserve advance"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full btn-primary-crimson text-xs min-h-[48px] font-medium">
                {t("formSubmitTransfer")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE TASK */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
          <div className="surface-panel w-full sm:max-w-md rounded-t-[20px] sm:rounded-[14px] p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[var(--color-primary,#ff1e42)]" />
                <h3 className="text-sm font-medium text-[#fdfdfd]">{t("modalTaskTitle")}</h3>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("taskTitle")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rig waterproof housing on A-Cam"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">{t("formDept")}</label>
                  <select
                    value={taskDept}
                    onChange={(e) => setTaskDept(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  >
                    {store.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">{t("taskAssignee")}</label>
                  <input
                    type="text"
                    placeholder="e.g. Leo Hardi"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("taskPriority")}</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                >
                  <option value="low">{t("priorityLow")}</option>
                  <option value="medium">{t("priorityMedium")}</option>
                  <option value="high">{t("priorityHigh")}</option>
                  <option value="urgent">{t("priorityUrgent")}</option>
                </select>
              </div>

              <button type="submit" className="w-full btn-primary-crimson text-xs min-h-[48px] font-medium">
                {t("formSubmitTask")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT CALL SHEET */}
      {/* ========================================================================= */}
      {isCallSheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
          <div className="surface-panel w-full sm:max-w-lg rounded-t-[20px] sm:rounded-[14px] p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[var(--color-primary,#ff1e42)]" />
                <h3 className="text-sm font-medium text-[#fdfdfd]">
                  {t("editCallSheet")} - Day {store.callSheet.dayNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsCallSheetModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCallSheet} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">{t("callTime")}</label>
                  <input
                    type="text"
                    required
                    value={csCallTime}
                    onChange={(e) => setCsCallTime(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">{t("estimatedWrap")}</label>
                  <input
                    type="text"
                    required
                    value={csWrapTime}
                    onChange={(e) => setCsWrapTime(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("location")} Name</label>
                <input
                  type="text"
                  required
                  value={csLocation}
                  onChange={(e) => setCsLocation(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("location")} Address</label>
                <input
                  type="text"
                  value={csAddress}
                  onChange={(e) => setCsAddress(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Scheduled Scenes</label>
                <input
                  type="text"
                  value={csScenes}
                  onChange={(e) => setCsScenes(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("weather")} Summary</label>
                <input
                  type="text"
                  value={csWeather}
                  onChange={(e) => setCsWeather(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("directorNotes")}</label>
                <textarea
                  rows={3}
                  value={csNotes}
                  onChange={(e) => setCsNotes(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-[12px] p-3 text-xs text-[#fdfdfd] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("emergencyContact")}</label>
                <input
                  type="text"
                  value={csEmergency}
                  onChange={(e) => setCsEmergency(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full btn-primary-crimson text-xs min-h-[48px] font-medium">
                Save Call Sheet Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD EQUIPMENT */}
      {/* ========================================================================= */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
          <div className="surface-panel w-full sm:max-w-md rounded-t-[20px] sm:rounded-[14px] p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--color-primary,#ff1e42)]" />
                <h3 className="text-sm font-medium text-[#fdfdfd]">{t("addEquipment")}</h3>
              </div>
              <button
                onClick={() => setIsEquipmentModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Gear / Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony FX6 Cinema Camera Package"
                  value={eqItemName}
                  onChange={(e) => setEqItemName(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Vendor / Rental House</label>
                  <input
                    type="text"
                    placeholder="e.g. CamTek Rentals"
                    value={eqVendor}
                    onChange={(e) => setEqVendor(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Department</label>
                  <input
                    type="text"
                    value={eqDept}
                    onChange={(e) => setEqDept(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">
                    Daily Rate ({currencies[currency].symbol} {currencies[currency].code})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={currency === "IDR" ? "e.g. 5000000" : "e.g. 350.00"}
                    value={eqDailyRate}
                    onChange={(e) => setEqDailyRate(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Return Date</label>
                  <input
                    type="text"
                    value={eqReturnDate}
                    onChange={(e) => setEqReturnDate(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary-crimson text-xs min-h-[48px] font-medium">
                Add Rental Gear
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: RECEIPT INSPECTOR LIGHTBOX */}
      {/* ========================================================================= */}
      {previewReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="surface-panel w-full max-w-lg rounded-[18px] p-6 relative border border-white/[0.1] shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                <h3 className="text-sm font-semibold text-white">
                  {t("receiptPreview")} • {previewReceiptTx.id}
                </h3>
              </div>
              <button
                onClick={() => setPreviewReceiptTx(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-[12px] overflow-hidden bg-black/50 border border-white/[0.08] flex items-center justify-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewReceiptTx.receiptUrl || "/icon.png"}
                  alt={previewReceiptTx.description}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="surface-overlay p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Description:</span>
                  <span className="text-white font-medium">{previewReceiptTx.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Vendor:</span>
                  <span className="text-white font-medium">{previewReceiptTx.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Amount:</span>
                  <span className="text-white font-mono font-bold">{formatMoney(previewReceiptTx.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Logged At:</span>
                  <span className="text-[#a3a3a3]">{previewReceiptTx.loggedAt}</span>
                </div>
                {previewReceiptTx.notes && (
                  <div className="pt-2 border-t border-white/[0.06] text-[11px] text-[#737373] italic">
                    Notes: {previewReceiptTx.notes}
                  </div>
                )}
              </div>

              <button
                onClick={() => setPreviewReceiptTx(null)}
                className="w-full btn-ghost-pill text-xs min-h-[44px] text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: CATEGORY (DEPARTMENT) CREATOR & EDITOR */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="surface-panel w-full max-w-md rounded-[18px] p-6 relative border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--color-primary,#ff1e42)]" />
                <h3 className="text-sm font-semibold text-white">
                  {editingCategory ? t("editCategory") : t("addCategory")}
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#737373] hover:text-white p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {catError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {catError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("categoryName")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations & Logistics"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">{t("categoryCode")}</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g. OPS"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] uppercase font-mono focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">
                    {t("categoryBudget")} ({currency})
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 25000"
                    value={catBudget}
                    onChange={(e) => setCatBudget(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] font-mono focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">{t("categoryColor")}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-10 h-10 rounded-full border border-white/[0.1] bg-transparent cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-[#a3a3a3] uppercase">{catColor}</span>
                  <div className="flex gap-1.5 ml-auto">
                    {["#14b8a6", "#8b5cf6", "#38bdf8", "#94a3b8", "#06b6d4", "#a855f7", "#ec4899"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCatColor(c)}
                        className={`w-6 h-6 rounded-full border transition-transform ${catColor === c ? "scale-110 border-white" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 btn-ghost-pill text-xs min-h-[44px] text-white"
                >
                  {t("close")}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary-crimson text-xs min-h-[44px] font-medium"
                >
                  {t("saveCategory")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: NEW PRODUCTION ────────────────────────────────────────── */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="surface-card w-full max-w-md p-6 rounded-2xl border border-white/[0.1] shadow-2xl relative my-8"
          >
            <button
              onClick={() => {
                setIsNewProjectModalOpen(false);
                setNewProjError(null);
              }}
              className="absolute top-5 right-5 text-[#737373] hover:text-[#fdfdfd] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary,#ff1e42)]/10 text-[var(--color-primary,#ff1e42)] border border-[var(--color-primary,#ff1e42)]/20 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#fdfdfd]">
                  {t("createProjectTitle")}
                </h2>
                <p className="text-xs text-[#737373]">
                  {t("createProjectDesc")}
                </p>
              </div>
            </div>

            {newProjError && (
              <div className="p-3 my-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{newProjError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-[#a3a3a3] block mb-1 font-medium">
                  {t("projectName")} <span className="text-[var(--color-primary,#ff1e42)]">*</span>
                </label>
                <input
                  id="new-project-name"
                  type="text"
                  placeholder="e.g. Documentary 2026: Voices of the Deep"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-[#121212] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#fdfdfd] placeholder-[#525252] focus:outline-none focus:border-[var(--color-primary,#ff1e42)] min-h-[44px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#a3a3a3] block mb-1 font-medium">
                    {t("projectBudget")} ($) <span className="text-[var(--color-primary,#ff1e42)]">*</span>
                  </label>
                  <input
                    id="new-project-budget"
                    type="number"
                    min="1"
                    placeholder="e.g. 50000"
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(e.target.value)}
                    className="w-full bg-[#121212] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#fdfdfd] font-mono placeholder-[#525252] focus:outline-none focus:border-[var(--color-primary,#ff1e42)] min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#a3a3a3] block mb-1 font-medium">
                    {t("projectShootDays")} <span className="text-[var(--color-primary,#ff1e42)]">*</span>
                  </label>
                  <input
                    id="new-project-days"
                    type="number"
                    min="1"
                    placeholder="16"
                    value={newProjDays}
                    onChange={(e) => setNewProjDays(e.target.value)}
                    className="w-full bg-[#121212] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#fdfdfd] font-mono placeholder-[#525252] focus:outline-none focus:border-[var(--color-primary,#ff1e42)] min-h-[44px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#a3a3a3] block mb-1 font-medium">
                  {t("projectDirector")} <span className="text-[var(--color-primary,#ff1e42)]">*</span>
                </label>
                <input
                  id="new-project-director"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={newProjDirector}
                  onChange={(e) => setNewProjDirector(e.target.value)}
                  className="w-full bg-[#121212] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#fdfdfd] placeholder-[#525252] focus:outline-none focus:border-[var(--color-primary,#ff1e42)] min-h-[44px]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewProjectModalOpen(false);
                    setNewProjError(null);
                  }}
                  className="px-4 py-2.5 text-xs font-medium text-[#a3a3a3] hover:text-[#fdfdfd] transition-colors min-h-[44px] cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  id="submit-new-project"
                  type="submit"
                  className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[var(--color-primary,#ff1e42)] text-white hover:brightness-110 shadow-lg shadow-[var(--color-primary,#ff1e42)]/20 transition-all min-h-[44px] cursor-pointer"
                >
                  {t("createProjectButton")}
                </button>
              </div>
            </form>
          </m.div>
        </div>
      )}

      {/* ─── MODAL: SWITCH CONFIRMATION ──────────────────────────────────── */}
      {isSwitchConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="surface-card w-full max-w-sm p-6 rounded-2xl border border-white/[0.1] shadow-2xl relative"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#fdfdfd]">
                  {t("switchConfirmTitle")}
                </h3>
                <span className="text-[11px] text-[#737373]">
                  ClosedBook Context Isolation
                </span>
              </div>
            </div>

            <p className="text-xs text-[#a3a3a3] leading-relaxed my-3">
              {t("switchConfirmDesc").replace(
                "{name}",
                store.projects.find((p) => p.id === pendingSwitchProjectId)?.name || "selected production"
              )}
            </p>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.06]">
              <button
                id="cancel-switch-project-btn"
                type="button"
                onClick={() => {
                  setPendingSwitchProjectId(null);
                  setIsSwitchConfirmModalOpen(false);
                }}
                className="px-4 py-2.5 text-xs font-medium text-[#a3a3a3] hover:text-[#fdfdfd] transition-colors min-h-[44px] cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                id="confirm-switch-project-btn"
                type="button"
                onClick={handleConfirmSwitchProject}
                className="px-4 py-2.5 text-xs font-medium rounded-xl bg-[var(--color-primary,#ff1e42)] text-white hover:brightness-110 shadow-lg shadow-[var(--color-primary,#ff1e42)]/20 transition-all min-h-[44px] cursor-pointer"
              >
                {t("confirmSwitch")}
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* Contextual Comment Drawer (Transactions & Tasks) */}
      <CommentDrawer
        isOpen={Boolean(activeCommentEntity)}
        onClose={() => setActiveCommentEntity(null)}
        entityId={activeCommentEntity?.id || null}
        entityTitle={activeCommentEntity?.title || ""}
        comments={store.comments}
        onAddComment={(entityId, author, message) => {
          store.addComment(entityId, author, message);
        }}
      />

      {/* ========================================================================= */}
      {/* PRINT-ONLY PRODUCTION WRAP REPORT (AUDIT PDF & PHYSICAL SIGN-OFF) */}
      {/* ========================================================================= */}
      <div className="print-only p-8 text-black bg-white">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">{store.project.name}</h1>
            <p className="text-xs text-neutral-600 mt-1">
              OFFICIAL PRODUCTION WRAP REPORT • FEATURE FILM • DAY {store.callSheet.dayNumber} OF {store.callSheet.totalDays}
            </p>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-bold">ClosedBook Accounting Audit</div>
            <div suppressHydrationWarning>Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-4 gap-4 mb-6 border border-neutral-300 p-4 rounded">
          <div>
            <div className="text-[10px] uppercase text-neutral-500 font-semibold">Total Budget</div>
            <div className="text-base font-bold font-mono">{formatMoney(store.project.totalBudget)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500 font-semibold">Total Disbursed</div>
            <div className="text-base font-bold font-mono">{formatMoney(totalSpent)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500 font-semibold">Uncommitted Cash</div>
            <div className="text-base font-bold font-mono">{formatMoney(store.project.totalBudget - totalSpent)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500 font-semibold">Budget Burn Rate</div>
            <div className="text-base font-bold font-mono">{((totalSpent / store.project.totalBudget) * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Department Breakdown */}
        <h2 className="text-sm font-bold uppercase mb-2">Department Allocations &amp; Expenditure</h2>
        <table className="w-full text-xs mb-6 border border-neutral-300">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
              <th className="p-2">Department</th>
              <th className="p-2">Dept Code</th>
              <th className="p-2 text-right">Budget</th>
              <th className="p-2 text-right">Spent</th>
              <th className="p-2 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {store.departments.map((d) => (
              <tr key={d.id} className="border-b border-neutral-200">
                <td className="p-2 font-medium">{d.name}</td>
                <td className="p-2 text-neutral-600 font-mono">{d.code}</td>
                <td className="p-2 text-right font-mono">{formatMoney(d.allocatedBudget)}</td>
                <td className="p-2 text-right font-mono">{formatMoney(d.spentAmount)}</td>
                <td className="p-2 text-right font-mono">{formatMoney(d.allocatedBudget - d.spentAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Petty Cash Transactions */}
        <h2 className="text-sm font-bold uppercase mb-2">Petty Cash Transactions Log ({store.transactions.length} Records)</h2>
        <table className="w-full text-[11px] mb-8 border border-neutral-300">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
              <th className="p-2">TX Ref</th>
              <th className="p-2">Date</th>
              <th className="p-2">Vendor / Merchant</th>
              <th className="p-2">Department</th>
              <th className="p-2">Description</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {store.transactions.slice(0, 30).map((t) => (
              <tr key={t.id} className="border-b border-neutral-200">
                <td className="p-2 font-mono">{t.id}</td>
                <td className="p-2">{t.loggedAt}</td>
                <td className="p-2 font-medium">{t.vendor}</td>
                <td className="p-2">{t.departmentName}</td>
                <td className="p-2">{t.description}</td>
                <td className="p-2 text-right font-mono">{formatMoney(t.amount)}</td>
                <td className="p-2 text-center uppercase font-mono">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sign-off Signatures */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t-2 border-black text-center text-xs">
          <div>
            <div className="h-12 border-b border-neutral-400 mb-2"></div>
            <div className="font-bold">Line Producer (Elena Rostova)</div>
            <div className="text-[10px] text-neutral-500">Authorization &amp; Wrap Approval</div>
          </div>
          <div>
            <div className="h-12 border-b border-neutral-400 mb-2"></div>
            <div className="font-bold">Unit Production Manager (UPM)</div>
            <div className="text-[10px] text-neutral-500">Field Receipts Audit &amp; Verification</div>
          </div>
          <div>
            <div className="h-12 border-b border-neutral-400 mb-2"></div>
            <div className="font-bold">Production Accountant</div>
            <div className="text-[10px] text-neutral-500">Google Sheets Ledger Reconciliation</div>
          </div>
        </div>
      </div>
    </div>
  );
}
