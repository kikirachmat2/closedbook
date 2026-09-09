"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useClosebookStore,
} from "@/lib/store";
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
  X,
  Layers,
} from "lucide-react";

type TabId =
  | "overview"
  | "transactions"
  | "pockets"
  | "tasks"
  | "callsheet"
  | "equipment"
  | "alerts"
  | "sync";

export default function WorkspacePage() {
  const store = useClosebookStore();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeCommentTxId, setActiveCommentTxId] = useState<string | null>(null);

  // Form states
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDept, setNewDept] = useState("dept-unt");
  const [newPocket, setNewPocket] = useState("pkt-upm");
  const [newVendor, setNewVendor] = useState("");
  const [missingReceiptCheck, setMissingReceiptCheck] = useState(false);

  // Transfer form
  const [transferSource, setTransferSource] = useState("pkt-master");
  const [transferDest, setTransferDest] = useState("pkt-upm");
  const [transferAmount, setTransferAmount] = useState("");

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDept, setTaskDept] = useState("dept-art");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  // Comment state
  const [commentText, setCommentText] = useState("");

  // Filtered transactions
  const filteredTransactions = store.transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === "all" || tx.departmentId === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;

    store.addTransaction({
      description: newDesc,
      amount: parseFloat(newAmount),
      departmentId: newDept,
      pocketId: newPocket,
      vendor: newVendor || "Local Vendor",
      isMissingReceipt: missingReceiptCheck,
    });

    setNewDesc("");
    setNewAmount("");
    setNewVendor("");
    setMissingReceiptCheck(false);
    setIsLogModalOpen(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount) return;
    store.transferFunds(transferSource, transferDest, parseFloat(transferAmount));
    setTransferAmount("");
    setIsTransferModalOpen(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    const targetDept = store.departments.find((d) => d.id === taskDept);
    store.addTask({
      title: taskTitle,
      departmentId: taskDept,
      departmentName: targetDept ? targetDept.name : "Production",
      assignee: taskAssignee || "Unassigned",
      priority: taskPriority,
      status: "todo",
      dueDate: "Day 4",
    });
    setTaskTitle("");
    setTaskAssignee("");
    setIsTaskModalOpen(false);
  };

  const handleSendComment = (entityId: string) => {
    if (!commentText.trim()) return;
    store.addComment(entityId, "Current User (UPM)", commentText.trim());
    setCommentText("");
  };

  const totalSpent = store.departments.reduce((acc, d) => acc + d.spentAmount, 0);
  const totalAllocated = store.departments.reduce((acc, d) => acc + d.allocatedBudget, 0);
  const activeAlertsCount = store.alerts.filter((a) => !a.isResolved).length;

  return (
    <div className="min-h-screen bg-[#050505] text-[#fdfdfd] selection:bg-[#ff1e42] selection:text-[#ffffff] flex flex-col md:flex-row pb-20 md:pb-0">
      {/* 1. Desktop & Tablet Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-[#090909] border-r border-white/[0.06] flex-col justify-between shrink-0 p-5">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-3 min-h-[44px]">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#121212] border border-white/[0.08] flex items-center justify-center">
                <Image src="/icon.png" alt="Closebook" width={32} height={32} className="object-cover" />
              </div>
              <span className="text-base font-medium tracking-tight text-[#fdfdfd]">
                closebook<span className="text-[#ff1e42]">.</span>
              </span>
            </Link>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#181818] text-[#a3a3a3] border border-white/[0.06]">
              OS v1.0
            </span>
          </div>

          {/* Project Switcher Info Card */}
          <div className="surface-overlay p-3.5 mb-6">
            <span className="text-[10px] uppercase tracking-wider text-[#737373] block mb-1 font-medium">
              Active Production
            </span>
            <span className="text-xs font-medium text-[#fdfdfd] block truncate">
              {store.project.name}
            </span>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-[#a3a3a3]">
              <span className="w-2 h-2 rounded-full bg-[#ff1e42] animate-pulse" />
              <span>Day 4 of 16</span>
              <span>•</span>
              <span className="text-[#10b981] font-medium">Sync Active</span>
            </div>
          </div>

          {/* Nav Items (Ergonomic min-h-[44px] touch target) */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#ff1e42] shrink-0" />
              <span>Executive Overview</span>
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
                <Receipt className="w-4 h-4 text-[#ff1e42] shrink-0" />
                <span>Petty Cash Ledger</span>
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
              <WalletCards className="w-4 h-4 text-[#ff1e42] shrink-0" />
              <span>Multi-Pocket Cashflow</span>
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
                <CheckSquare className="w-4 h-4 text-[#ff1e42] shrink-0" />
                <span>Department Tasks</span>
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
              <Film className="w-4 h-4 text-[#ff1e42] shrink-0" />
              <span>Digital Call Sheet</span>
            </button>

            <button
              onClick={() => setActiveTab("equipment")}
              className={`w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                activeTab === "equipment"
                  ? "bg-[#181818] text-[#ffffff] border border-white/[0.12] shadow-sm"
                  : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
              }`}
            >
              <Package className="w-4 h-4 text-[#ff1e42] shrink-0" />
              <span>Equipment Rental</span>
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
                <Bell className="w-4 h-4 text-[#ff1e42] shrink-0" />
                <span>Automated Alerts</span>
              </div>
              {activeAlertsCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-white bg-[#ff1e42] px-2 py-0.5 rounded-full">
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
              <FileSpreadsheet className="w-4 h-4 text-[#ff1e42] shrink-0" />
              <span>Google Sheet Mirror</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Controls */}
        <div className="pt-6 border-t border-white/[0.06] space-y-3">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="w-full btn-primary-crimson text-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Log Petty Cash</span>
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
        {/* Top Header Bar (Adaptive Mobile/Desktop) */}
        <header className="h-16 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Brand Logo */}
            <Link href="/" className="md:hidden flex items-center gap-2 min-h-[44px]">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[#121212] border border-white/[0.08] flex items-center justify-center">
                <Image src="/icon.png" alt="Closebook" width={28} height={28} className="object-cover" />
              </div>
              <span className="text-sm font-medium tracking-tight text-[#fdfdfd]">
                closebook<span className="text-[#ff1e42]">.</span>
              </span>
            </Link>

            <div className="hidden md:block">
              <h1 className="text-sm font-medium text-[#fdfdfd] capitalize">
                {activeTab === "overview" && "Executive Dashboard"}
                {activeTab === "transactions" && "Petty Cash Transactions Ledger"}
                {activeTab === "pockets" && "Multi-Pocket Cashflow Hierarchy"}
                {activeTab === "tasks" && "Department Workflows & Tasks"}
                {activeTab === "callsheet" && "Today's Call Sheet & Schedule"}
                {activeTab === "equipment" && "Rental Gear & Vendor Tracker"}
                {activeTab === "alerts" && "Automated Warnings & Reminders"}
                {activeTab === "sync" && "Google Workspace Sync Engine"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121212] border border-white/[0.06] text-xs text-[#a3a3a3] min-h-[36px]">
              <span className="w-2 h-2 rounded-full bg-[#ff1e42] animate-pulse" />
              <span className="hidden sm:inline">Drive Vault:</span>
              <span className="font-mono text-[#fdfdfd] text-[11px]">Synced</span>
            </div>

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="btn-primary-crimson text-xs min-h-[40px] px-3.5 hidden sm:inline-flex"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>
        </header>

        {/* Tab Content Panels */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-1">
          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="surface-panel p-5">
                  <span className="text-xs text-[#737373] block mb-1">Total Production Budget</span>
                  <span className="text-2xl font-mono font-medium text-[#fdfdfd]">
                    ${store.project.totalBudget.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#a3a3a3] mt-2 block">100% committed</span>
                </div>

                <div className="surface-panel p-5">
                  <span className="text-xs text-[#737373] block mb-1">Disbursed to Departments</span>
                  <span className="text-2xl font-mono font-medium text-[#fdfdfd]">
                    ${totalSpent.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#ff1e42] mt-2 block font-medium">
                    {((totalSpent / totalAllocated) * 100).toFixed(1)}% burn rate
                  </span>
                </div>

                <div className="surface-panel p-5">
                  <span className="text-xs text-[#737373] block mb-1">UPM Field Cash on Hand</span>
                  <span className="text-2xl font-mono font-medium text-[#10b981]">
                    ${store.pockets.find((p) => p.id === "pkt-upm")?.balance.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#a3a3a3] mt-2 block">Sufficient for Day 4</span>
                </div>

                <div className="surface-panel p-5">
                  <span className="text-xs text-[#737373] block mb-1">Active Automated Alerts</span>
                  <span className="text-2xl font-mono font-medium text-[#ff1e42]">
                    {activeAlertsCount} Flags
                  </span>
                  <span className="text-[11px] text-[#a3a3a3] mt-2 block">Audit required</span>
                </div>
              </div>

              {/* Department Budget Burn-rate Progress Bars */}
              <div className="surface-panel p-5 sm:p-6">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-medium text-[#fdfdfd]">Department Budget Realization</h3>
                    <p className="text-xs text-[#737373] mt-0.5">Real-time spend tracking against departmental ceiling</p>
                  </div>
                  <span className="text-xs text-[#a3a3a3] font-mono hidden sm:inline">
                    {store.departments.length} Departments
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {store.departments.map((dept) => {
                    const pct = Math.min(100, Math.round((dept.spentAmount / dept.allocatedBudget) * 100));
                    const isHigh = pct >= 80;
                    return (
                      <div key={dept.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#fdfdfd] flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                            {dept.name}
                          </span>
                          <span className="font-mono text-[#a3a3a3]">
                            ${dept.spentAmount.toLocaleString()} / ${dept.allocatedBudget.toLocaleString()}
                            <span className={`ml-2 font-bold ${isHigh ? "text-[#ff1e42]" : "text-[#737373]"}`}>
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        {/* Progress track */}
                        <div className="h-2 w-full bg-[#181818] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: isHigh ? "#ff1e42" : dept.color,
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
                    <h3 className="text-sm font-medium text-[#fdfdfd]">Recent Petty Cash Entries</h3>
                    <button
                      onClick={() => setActiveTab("transactions")}
                      className="text-xs text-[#ff1e42] hover:underline min-h-[36px] flex items-center"
                    >
                      View All Ledger
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
                            ${tx.amount.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-medium capitalize ${
                              tx.status === "approved"
                                ? "text-[#10b981]"
                                : tx.status === "rejected"
                                ? "text-[#ff1e42]"
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
                    <h3 className="text-sm font-medium text-[#fdfdfd]">Active Production Flags</h3>
                    <span className="text-xs text-[#737373]">Cron Guardrails</span>
                  </div>

                  <div className="space-y-3">
                    {store.alerts.filter((a) => !a.isResolved).map((alert) => (
                      <div
                        key={alert.id}
                        className="surface-overlay p-4 flex items-start gap-3"
                      >
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            alert.severity === "critical" ? "text-[#ff1e42]" : "text-amber-400"
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
                              className="text-[11px] font-medium text-[#ff1e42] hover:underline min-h-[36px] flex items-center"
                            >
                              Resolve
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
          {/* TAB 2: TRANSACTIONS & PETTY CASH LEDGER */}
          {/* ========================================================================= */}
          {activeTab === "transactions" && (
            <div className="space-y-6 animate-fade-in">
              {/* Action Bar & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]" />
                    <input
                      type="text"
                      placeholder="Search description, vendor, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#121212] border border-white/[0.08] rounded-full pl-10 pr-4 min-h-[44px] text-xs text-[#fdfdfd] placeholder-[#737373] focus:outline-none focus:border-[#ff1e42]"
                    />
                  </div>

                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="bg-[#121212] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  >
                    <option value="all">All Departments</option>
                    {store.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="btn-primary-crimson text-xs min-h-[44px] px-5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Petty Cash</span>
                </button>
              </div>

              {/* Transactions Table */}
              <div className="surface-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[#737373] uppercase tracking-wider text-[10px]">
                        <th className="p-4">ID</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Pocket</th>
                        <th className="p-4">Vendor</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono text-[#737373]">{tx.id}</td>
                          <td className="p-4">
                            <div className="font-medium text-[#fdfdfd]">{tx.description}</div>
                            <div className="text-[11px] text-[#737373] mt-0.5">{tx.loggedAt}</div>
                            {tx.isMissingReceipt && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#ff1e42] font-semibold mt-1">
                                <AlertTriangle className="w-3 h-3" /> Missing Receipt Photo
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-[#a3a3a3]">{tx.departmentName}</td>
                          <td className="p-4 font-mono text-[11px] text-[#737373]">{tx.pocketName}</td>
                          <td className="p-4 text-[#a3a3a3]">{tx.vendor}</td>
                          <td className="p-4 font-mono font-medium text-[#fdfdfd]">
                            ${tx.amount.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase ${
                                tx.status === "approved"
                                  ? "bg-[#10b981]/15 text-[#10b981] font-semibold"
                                  : tx.status === "rejected"
                                  ? "bg-[#ff1e42]/15 text-[#ff1e42] font-semibold"
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
                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#ff1e42] hover:bg-white/[0.05] rounded-full"
                                    title="Reject Transaction"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setActiveCommentTxId(activeCommentTxId === tx.id ? null : tx.id)}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd] hover:bg-white/[0.05] rounded-full"
                                title="Context Discussion"
                              >
                                <MessageSquare className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Contextual Discussion Drawer */}
              {activeCommentTxId && (
                <div className="surface-panel p-5 sm:p-6 border border-[#ff1e42]/30 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#ff1e42]" />
                      <span className="text-xs font-medium text-[#fdfdfd]">
                        Context Discussion on {activeCommentTxId}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveCommentTxId(null)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    {store.comments
                      .filter((c) => c.entityId === activeCommentTxId)
                      .map((comm) => (
                        <div key={comm.id} className="surface-overlay p-3 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-[#fdfdfd]">{comm.author}</span>
                            <span className="text-[10px] text-[#737373]">{comm.timestamp}</span>
                          </div>
                          <p className="text-[#a3a3a3]">{comm.message}</p>
                        </div>
                      ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a contextual comment regarding this expense..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendComment(activeCommentTxId)}
                      className="flex-1 bg-[#121212] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                    />
                    <button
                      onClick={() => handleSendComment(activeCommentTxId)}
                      className="btn-primary-crimson min-h-[44px] min-w-[44px] px-4"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MULTI-POCKET CASHFLOW */}
          {/* ========================================================================= */}
          {activeTab === "pockets" && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium text-[#fdfdfd]">Hierarchical Cash Pockets</h2>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Track cash movement from Executive Producer to Field Coordinators without co-mingling funds.
                  </p>
                </div>
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="btn-primary-crimson text-xs min-h-[44px] px-5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Transfer Pocket Funds</span>
                </button>
              </div>

              {/* Hierarchy Tree Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {store.pockets.map((pocket, idx) => (
                  <div key={pocket.id} className="surface-panel p-5 sm:p-6 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono text-[#ff1e42] bg-[#ff1e42]/10 px-2.5 py-1 rounded-full uppercase">
                          Tier {idx + 1} • {pocket.type.replace("_", " ")}
                        </span>
                        <WalletCards className="w-4 h-4 text-[#737373]" />
                      </div>

                      <h3 className="text-base font-medium text-[#fdfdfd] mb-1">{pocket.name}</h3>
                      <span className="text-xs text-[#a3a3a3] block mb-4">Custodian: {pocket.custodian}</span>

                      <div className="surface-overlay p-4 mb-4">
                        <span className="text-xs text-[#737373] block mb-1">Current Liquid Balance</span>
                        <span className="text-2xl font-mono font-medium text-[#fdfdfd]">
                          ${pocket.balance.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#737373]">
                      <span>Max Cap: ${pocket.allocated.toLocaleString()}</span>
                      <span className="text-[#10b981] font-medium">Audited & Active</span>
                    </div>
                  </div>
                ))}
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
                  <h2 className="text-xl font-medium text-[#fdfdfd]">Department Coordination & To-Do</h2>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Noise-free task tracking isolated by production department.
                  </p>
                </div>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="btn-primary-crimson text-xs min-h-[44px] px-5"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Department Task</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {/* Column 1: To Do */}
                <div className="surface-panel p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs uppercase tracking-wider text-[#737373] font-medium">To-Do</span>
                    <span className="text-xs font-mono text-[#a3a3a3]">
                      {store.tasks.filter((t) => t.status === "todo").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {store.tasks
                      .filter((t) => t.status === "todo")
                      .map((task) => (
                        <div
                          key={task.id}
                          onClick={() => store.toggleTask(task.id)}
                          className="surface-overlay p-4 cursor-pointer hover:border-white/[0.15] transition-all min-h-[44px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-[#737373]">{task.departmentName}</span>
                            <span className="text-[10px] font-mono text-[#ff1e42] uppercase font-semibold">{task.priority}</span>
                          </div>
                          <span className="text-xs font-medium text-[#fdfdfd] block mb-2">{task.title}</span>
                          <div className="flex items-center justify-between text-[11px] text-[#737373]">
                            <span>{task.assignee}</span>
                            <span>{task.dueDate}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="surface-panel p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs uppercase tracking-wider text-amber-400 font-medium">In Progress</span>
                    <span className="text-xs font-mono text-[#a3a3a3]">
                      {store.tasks.filter((t) => t.status === "in_progress").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {store.tasks
                      .filter((t) => t.status === "in_progress")
                      .map((task) => (
                        <div
                          key={task.id}
                          onClick={() => store.toggleTask(task.id)}
                          className="surface-overlay p-4 cursor-pointer hover:border-white/[0.15] transition-all min-h-[44px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-[#737373]">{task.departmentName}</span>
                            <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">{task.priority}</span>
                          </div>
                          <span className="text-xs font-medium text-[#fdfdfd] block mb-2">{task.title}</span>
                          <div className="flex items-center justify-between text-[11px] text-[#737373]">
                            <span>{task.assignee}</span>
                            <span>{task.dueDate}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Column 3: Completed */}
                <div className="surface-panel p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs uppercase tracking-wider text-[#10b981] font-medium">Completed</span>
                    <span className="text-xs font-mono text-[#a3a3a3]">
                      {store.tasks.filter((t) => t.status === "completed").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {store.tasks
                      .filter((t) => t.status === "completed")
                      .map((task) => (
                        <div
                          key={task.id}
                          onClick={() => store.toggleTask(task.id)}
                          className="surface-overlay p-4 opacity-60 cursor-pointer hover:opacity-100 transition-all line-through min-h-[44px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-[#737373]">{task.departmentName}</span>
                            <span className="text-[10px] font-mono text-[#10b981] font-semibold">Done</span>
                          </div>
                          <span className="text-xs font-medium text-[#fdfdfd] block mb-2">{task.title}</span>
                          <div className="flex items-center justify-between text-[11px] text-[#737373]">
                            <span>{task.assignee}</span>
                            <span>{task.dueDate}</span>
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
              <div className="surface-panel p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-white/[0.06] gap-4">
                  <div>
                    <span className="text-xs font-mono text-[#ff1e42] uppercase tracking-wider block mb-1 font-semibold">
                      Day {store.callSheet.dayNumber} of {store.callSheet.totalDays}
                    </span>
                    <h2 className="text-2xl font-medium text-[#fdfdfd]">{store.callSheet.date}</h2>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs text-[#737373] block">General Crew Call Time</span>
                    <span className="text-2xl font-mono font-medium text-[#ff1e42]">
                      {store.callSheet.callTime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-6">
                  <div className="surface-overlay p-4">
                    <span className="text-xs text-[#737373] flex items-center gap-1.5 mb-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#ff1e42]" /> Location Details
                    </span>
                    <span className="text-sm font-medium text-[#fdfdfd] block mb-1">
                      {store.callSheet.locationName}
                    </span>
                    <span className="text-xs text-[#a3a3a3]">{store.callSheet.locationAddress}</span>
                  </div>

                  <div className="surface-overlay p-4">
                    <span className="text-xs text-[#737373] flex items-center gap-1.5 mb-1.5 font-medium">
                      <CloudRain className="w-3.5 h-3.5 text-[#ff1e42]" /> Weather Forecast & Wrap
                    </span>
                    <span className="text-sm font-medium text-[#fdfdfd] block mb-1">
                      Est. Wrap: {store.callSheet.estimatedWrap}
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
                    <span className="text-xs text-[#737373] block mb-1 font-medium">Director & HOD Notes</span>
                    <p className="text-xs text-[#a3a3a3] leading-relaxed">{store.callSheet.directorNotes}</p>
                  </div>

                  <div className="p-4 rounded-[14px] bg-[#121212] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-[#737373] flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#ff1e42]" /> Emergency / Set Medic Contacts
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
              <div>
                <h2 className="text-xl font-medium text-[#fdfdfd]">Equipment & Rental Tracker</h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Avoid penalty fees with automatic return countdowns.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {store.equipment.map((eq) => (
                  <div key={eq.id} className="surface-panel p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#737373] uppercase">{eq.department}</span>
                        <span
                          className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase ${
                            eq.daysRemaining <= 2
                              ? "bg-[#ff1e42]/15 text-[#ff1e42] font-bold"
                              : "bg-[#10b981]/15 text-[#10b981] font-semibold"
                          }`}
                        >
                          {eq.daysRemaining} Days Left
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-[#fdfdfd] mb-1">{eq.itemName}</h3>
                      <span className="text-xs text-[#a3a3a3] block mb-4">Vendor: {eq.vendor}</span>
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-[#737373]">Due: {eq.returnDate}</span>
                      <span className="font-mono font-medium text-[#fdfdfd]">${eq.dailyRate}/day</span>
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
                <h2 className="text-xl font-medium text-[#fdfdfd]">Automated Production Guardrails</h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Scheduled cron alerts detecting anomalies, missing receipts, and budget overruns.
                </p>
              </div>

              <div className="space-y-3">
                {store.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`surface-panel p-5 flex items-start gap-4 transition-all ${
                      alert.isResolved ? "opacity-40" : ""
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        alert.severity === "critical" ? "text-[#ff1e42]" : "text-amber-400"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-[#fdfdfd]">{alert.title}</h3>
                        <span className="text-[11px] font-mono text-[#737373]">{alert.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#a3a3a3] leading-relaxed mb-3">{alert.message}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                        <span className="text-[10px] font-mono uppercase text-[#737373]">
                          Trigger: System Cron Job
                        </span>
                        {!alert.isResolved ? (
                          <button
                            onClick={() => store.resolveAlert(alert.id)}
                            className="btn-ghost-pill text-xs min-h-[38px] px-3.5 text-[#ff1e42] border-[#ff1e42]/30"
                          >
                            Acknowledge & Resolve
                          </button>
                        ) : (
                          <span className="text-xs text-[#10b981] flex items-center gap-1.5 font-mono font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: GOOGLE SHEET MIRROR & SYNC */}
          {/* ========================================================================= */}
          {activeTab === "sync" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-xl font-medium text-[#fdfdfd]">Google Workspace Live Mirror</h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Direct audit proof: Data streaming straight to the Producer&apos;s personal Google Drive and Sheets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="surface-panel p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <HardDrive className="w-4 h-4 text-[#ff1e42]" />
                    <h3 className="text-sm font-medium text-[#fdfdfd]">Google Drive Folder Tree</h3>
                  </div>
                  <div className="surface-overlay p-3.5 font-mono text-xs text-[#a3a3a3] space-y-1.5">
                    <div className="text-white font-medium">📁 SetFlow_Closebook_TheQuietHorizon/</div>
                    <div className="pl-4">📁 01_Petty_Cash_Receipts/ ({store.transactions.length} files)</div>
                    <div className="pl-4">📁 02_Daily_Call_Sheets/ (Day 1-4)</div>
                    <div className="pl-4">📁 03_Deal_Memos_Talent/ (28 signed)</div>
                    <div className="pl-4">📁 04_Rental_Equipment_POs/</div>
                  </div>
                </div>

                <div className="surface-panel p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileSpreadsheet className="w-4 h-4 text-[#ff1e42]" />
                    <h3 className="text-sm font-medium text-[#fdfdfd]">Google Sheet Ledger Status</h3>
                  </div>
                  <div className="surface-overlay p-3.5 font-mono text-xs text-[#a3a3a3] space-y-1.5">
                    <div className="text-white font-medium">📊 Master_Shooting_Ledger.xlsx</div>
                    <div>Sheet: &apos;Cashflow_Day_4&apos;</div>
                    <div>Row Count: {store.transactions.length + 1} rows</div>
                    <div className="text-[#10b981] font-semibold">Status: Dual-Stream Synced</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (Thumb Zone on Smartphones) */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070707]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "overview" ? "text-[#ff1e42]" : "text-[#737373]"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "transactions" ? "text-[#ff1e42]" : "text-[#737373]"
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Ledger</span>
        </button>

        {/* Mobile Central Quick Log Floating Action Button (FAB) */}
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="w-12 h-12 rounded-full bg-[#ff1e42] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,30,66,0.4)] -mt-4 shrink-0 transition-transform active:scale-95"
          title="Quick Log Petty Cash"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "tasks" ? "text-[#ff1e42]" : "text-[#737373]"
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Tasks</span>
        </button>

        <button
          onClick={() => setActiveTab("callsheet")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === "callsheet" ? "text-[#ff1e42]" : "text-[#737373]"
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Call Sheet</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LOG PETTY CASH (Bottom Sheet on Mobile, Centered on Desktop) */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
          <div className="surface-panel w-full sm:max-w-lg rounded-t-[20px] sm:rounded-[14px] p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#ff1e42]" />
                <h3 className="text-sm font-medium text-[#fdfdfd]">Log Petty Cash Expense</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Expense Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Generator Diesel (100L)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 240.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Vendor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Marina Gas Station"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Department</label>
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
                  <label className="block text-xs text-[#737373] mb-1.5">Deduct from Pocket</label>
                  <select
                    value={newPocket}
                    onChange={(e) => setNewPocket(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                  >
                    {store.pockets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Receipt Capture Simulator */}
              <div className="p-4 rounded-[14px] bg-[#181818] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Camera className="w-5 h-5 text-[#ff1e42]" />
                  <span className="text-xs text-[#d4d4d4]">Auto-compress to 300KB</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-[#a3a3a3] cursor-pointer min-h-[40px]">
                  <input
                    type="checkbox"
                    checked={missingReceiptCheck}
                    onChange={(e) => setMissingReceiptCheck(e.target.checked)}
                    className="w-4 h-4 accent-[#ff1e42]"
                  />
                  <span>Missing Receipt</span>
                </label>
              </div>

              <button type="submit" className="w-full btn-primary-crimson text-xs min-h-[48px] font-medium">
                Save & Stream to Google Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TRANSFER POCKET FUNDS */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
          <div className="surface-panel w-full sm:max-w-md rounded-t-[20px] sm:rounded-[14px] p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <WalletCards className="w-5 h-5 text-[#ff1e42]" />
                <h3 className="text-sm font-medium text-[#fdfdfd]">Transfer Pocket Funds</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Source Pocket (From)</label>
                <select
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                >
                  {store.pockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Balance: ${p.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Destination Pocket (To)</label>
                <select
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                >
                  {store.pockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Balance: ${p.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Transfer Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                />
              </div>

              <button type="submit" className="w-full btn-primary-crimson text-xs min-h-[48px] font-medium">
                Authorize & Disburse Cash
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
                <CheckSquare className="w-5 h-5 text-[#ff1e42]" />
                <h3 className="text-sm font-medium text-[#fdfdfd]">Create Department Task</h3>
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
                <label className="block text-xs text-[#737373] mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rig waterproof housing on A-Cam"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Department</label>
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
                  <label className="block text-xs text-[#737373] mb-1.5">Assignee</label>
                  <input
                    type="text"
                    placeholder="e.g. Leo Hardi"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-4 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-[#181818] border border-white/[0.08] rounded-full px-3.5 min-h-[44px] text-xs text-[#fdfdfd] focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <button type="submit" className="w-full btn-primary-crimson text-xs min-h-[48px] font-medium">
                Create & Assign Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
