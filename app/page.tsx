"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clapperboard,
  Building2,
  PartyPopper,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Lock,
  ExternalLink,
  Camera,
  ServerOff,
  EyeOff,
  Cpu,
  RefreshCw,
  Plus,
} from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import PreferencesControls from "@/components/PreferencesControls";

type WorkflowId = "film" | "agency" | "events" | "student" | "solo";

interface WorkflowData {
  id: WorkflowId;
  label: string;
  badge: string;
  projectName: string;
  pocketBalance: string;
  todayBurn: string;
  alertCount: string;
  driveFolder: string;
  sheetName: string;
  ledger: Array<{
    id: string;
    time: string;
    division: string;
    description: string;
    amount: string;
    status: "approved" | "pending" | "alert";
  }>;
}

const WORKFLOWS: Record<WorkflowId, WorkflowData> = {
  film: {
    id: "film",
    label: "Film & Video",
    badge: "Feature Film",
    projectName: "Feature Film: 'Dusk Over Harbor' — Day 6 of 18",
    pocketBalance: "$12,450.00",
    todayBurn: "$2,890.00",
    alertCount: "1 Missing Receipt",
    driveFolder: "ClosedBook/01_Petty_Cash_Receipts",
    sheetName: "Master_Shooting_Ledger.xlsx",
    ledger: [
      { id: "TX-101", time: "14:20", division: "Transport", description: "Location Generator Fuel & Logistics", amount: "$380.00", status: "approved" },
      { id: "TX-102", time: "17:45", division: "Catering", description: "Overtime Crew Dinner (40 Pax)", amount: "$640.00", status: "pending" },
      { id: "TX-103", time: "11:10", division: "Art Dept", description: "Living Room Props & Wall Primer", amount: "$190.00", status: "alert" },
      { id: "TX-104", time: "09:15", division: "Camera", description: "High-Speed Memory Card Rentals", amount: "$450.00", status: "approved" },
    ],
  },
  agency: {
    id: "agency",
    label: "Creative Agency",
    badge: "Client Retainer",
    projectName: "Agency Retainer: 'Apex Brand Refresh Q4'",
    pocketBalance: "$45,000.00",
    todayBurn: "$3,450.00",
    alertCount: "All Matched to PO",
    driveFolder: "ClosedBook_Agency/01_Invoices_Vendor_Bills",
    sheetName: "Client_Retainer_Billing.xlsx",
    ledger: [
      { id: "AG-201", time: "10:30", division: "Design", description: "Commercial Font License & 3D Assets", amount: "$1,200.00", status: "approved" },
      { id: "AG-202", time: "13:15", division: "Audio", description: "Voiceover Studio Recording Session", amount: "$850.00", status: "approved" },
      { id: "AG-203", time: "16:00", division: "Accounts", description: "Client Working Dinner Strategy", amount: "$320.00", status: "pending" },
    ],
  },
  events: {
    id: "events",
    label: "Live Events",
    badge: "Festival Ops",
    projectName: "Music Festival: 'Soundwave 2026' (Loading-In)",
    pocketBalance: "$28,500.00",
    todayBurn: "$8,200.00",
    alertCount: "Permits Verified",
    driveFolder: "ClosedBook_Events/01_Vendor_Downpayments",
    sheetName: "Venue_Disbursement_Sheet.xlsx",
    ledger: [
      { id: "EV-301", time: "09:00", division: "Staging", description: "Mainstage Rigging & Truss Advance", amount: "$4,500.00", status: "approved" },
      { id: "EV-302", time: "11:30", division: "Hospitality", description: "Artist Green Room Rider Supplies", amount: "$1,150.00", status: "approved" },
      { id: "EV-303", time: "15:10", division: "Ground Ops", description: "Waste Management & Venue Permits", amount: "$750.00", status: "pending" },
    ],
  },
  student: {
    id: "student",
    label: "Student & Non-Profit",
    badge: "Campus Org",
    projectName: "Annual Campus Gala & Charity Exhibition",
    pocketBalance: "$6,800.00",
    todayBurn: "$950.00",
    alertCount: "Audited by Treasurer",
    driveFolder: "ClosedBook_Campus/01_Original_Receipts_LPJ",
    sheetName: "Treasurer_Master_Report.xlsx",
    ledger: [
      { id: "ST-401", time: "10:00", division: "Media", description: "Main Stage Banner & Lanyards (200 pcs)", amount: "$280.00", status: "approved" },
      { id: "ST-402", time: "13:40", division: "Logistics", description: "Portable PA Sound System Rental", amount: "$150.00", status: "approved" },
      { id: "ST-403", time: "16:15", division: "Refreshment", description: "Keynote Speaker Welcome Boxes", amount: "$95.00", status: "approved" },
    ],
  },
  solo: {
    id: "solo",
    label: "Solo Studio",
    badge: "Independent",
    projectName: "Studio Operations: 'Client Retainers & Taxes'",
    pocketBalance: "$18,200.00",
    todayBurn: "$420.00",
    alertCount: "Tax Deductible",
    driveFolder: "ClosedBook_Solo/01_Tax_Deductible_Expenses",
    sheetName: "Annual_Tax_Deduction_Log.xlsx",
    ledger: [
      { id: "SO-501", time: "09:45", division: "Cloud", description: "Database Cluster & Hosting Tier", amount: "$120.00", status: "approved" },
      { id: "SO-502", time: "14:00", division: "Hardware", description: "Portable 4TB Thunderbolt SSD Backup", amount: "$220.00", status: "approved" },
      { id: "SO-503", time: "17:20", division: "Transit", description: "Client Studio Travel & Rideshare", amount: "$45.00", status: "approved" },
    ],
  },
};

export default function HomePage() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowId>("film");
  const [simulatedDesc, setSimulatedDesc] = useState("Location Generator Fuel & Oil");
  const [simulatedAmount, setSimulatedAmount] = useState("380");
  const [isSimulating, setIsSimulating] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const current = WORKFLOWS[activeWorkflow];
  const [liveLedger, setLiveLedger] = useState(current.ledger);

  const handleSwitchWorkflow = (id: WorkflowId) => {
    setActiveWorkflow(id);
    setLiveLedger(WORKFLOWS[id].ledger);
  };

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedDesc || !simulatedAmount) return;

    setIsSimulating(true);
    setSyncNotice("Compressing image client-side (~280 KB) & appending row to Google Sheets...");

    setTimeout(() => {
      const newEntry = {
        id: `TX-${Math.floor(100 + Math.random() * 900)}`,
        time: "Just now",
        division: "Field Ops",
        description: simulatedDesc,
        amount: `$${Number(simulatedAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        status: "approved" as const,
      };

      setLiveLedger([newEntry, ...liveLedger]);
      setIsSimulating(false);
      setSyncNotice("✓ Stored in Google Drive and synchronized with master Google Sheet.");
      setTimeout(() => setSyncNotice(null), 4500);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas,#050505)] text-[var(--color-paper,#fdfdfd)] selection:bg-[var(--color-primary,#ff1e42)] selection:text-[#ffffff]">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-[var(--surface-canvas,#050505)]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#121212] border border-white/[0.08] flex items-center justify-center">
              <Image
                src="/icon.png"
                alt="ClosedBook Icon"
                width={32}
                height={32}
                className="object-cover"
                priority
              />
            </div>
            <span className="text-lg font-medium tracking-tight text-[#fdfdfd]">
              closedbook<span className="text-[#ff1e42]">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#d4d4d4]">
            <Link href="/workspace" className="text-[#ff1e42] hover:text-[#ffffff] transition-colors font-medium">
              Live Workspace App
            </Link>
            <a href="#how-it-works" className="hover:text-[#fdfdfd] transition-colors">
              How It Works
            </a>
            <a href="#security" className="hover:text-[#fdfdfd] transition-colors">
              Data Sovereignty
            </a>
            <a
              href="https://github.com/kikirachmat2/closedbook"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#fdfdfd] transition-colors flex items-center gap-1.5"
            >
              GitHub
              <ExternalLink className="w-3.5 h-3.5 text-[#737373]" />
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <PreferencesControls />
            <Link href="/workspace" className="btn-primary-crimson text-xs md:text-sm py-2 px-4 sm:px-5">
              <span>Open Workspace</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="max-w-[1200px] mx-auto px-6 pt-16 md:pt-28 pb-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121212] border border-white/[0.08] text-[#d4d4d4] text-[13px] font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-[#ff1e42]" />
            Zero Server Retention • User-Owned Google Drive Architecture
          </div>

          <h1 className="display-headline mb-8">
            Your production.
            <br />
            Your Google Drive.
            <br />
            Zero server fees.
          </h1>

          <p className="subhead-caption max-w-2xl mx-auto mb-10">
            Field crews log expenses and snap receipts on set. Files stream directly into your personal
            Google Drive; ledgers mirror in Google Sheets. No monthly subscription, no vendor lock-in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/workspace" className="btn-primary-crimson text-sm px-8 py-3.5">
              Launch Production Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#security" className="btn-ghost-pill text-sm px-6 py-3.5">
              Review Security Model
              <ShieldCheck className="w-4 h-4 text-[#ff1e42]" />
            </a>
          </div>
        </div>

        {/* 3. Interactive Product Showcase Frame */}
        <section id="preview" className="mb-28">
          {/* Workflow Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {(Object.keys(WORKFLOWS) as WorkflowId[]).map((key) => {
              const item = WORKFLOWS[key];
              const isSelected = activeWorkflow === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSwitchWorkflow(key)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#181818] text-[#fdfdfd] border border-white/[0.15]"
                      : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#121212]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Elevated Product Surface */}
          <div className="surface-panel p-6 md:p-8">
            {/* Top Chrome / Window Frame */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-white/[0.06] gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                </div>
                <div className="h-3.5 w-[1px] bg-[#262626] mx-1" />
                <span className="text-sm font-medium text-[#fdfdfd]">{current.projectName}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#181818] text-[#a3a3a3] border border-white/[0.06]">
                  {current.badge}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#a3a3a3]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff1e42]" />
                  Direct Sync: <code className="text-[#fdfdfd] font-mono">{current.sheetName}</code>
                </span>
                <Link
                  href="/workspace"
                  className="text-xs text-[#ff1e42] hover:underline flex items-center gap-1"
                >
                  Open Full Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="surface-overlay p-4">
                <span className="text-xs text-[#737373] block mb-1">Available Floating Cash</span>
                <span className="text-2xl font-mono font-medium tracking-tight text-[#fdfdfd]">
                  {current.pocketBalance}
                </span>
              </div>
              <div className="surface-overlay p-4">
                <span className="text-xs text-[#737373] block mb-1">Disbursed Today</span>
                <span className="text-2xl font-mono font-medium tracking-tight text-[#fdfdfd]">
                  {current.todayBurn}
                </span>
              </div>
              <div className="surface-overlay p-4">
                <span className="text-xs text-[#737373] block mb-1">Audit Status</span>
                <span className="text-2xl font-mono font-medium tracking-tight text-[#ff1e42]">
                  {current.alertCount}
                </span>
              </div>
            </div>

            {/* Split View: Live Ledger & Interactive Input Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Ledger Table */}
              <div className="lg:col-span-8 surface-overlay p-5 overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <span className="text-xs uppercase tracking-wider text-[#737373] font-medium">
                    Master Ledger (Synced to Google Sheets)
                  </span>
                  <span className="text-xs text-[#a3a3a3]">Drive Vault: {current.driveFolder}</span>
                </div>

                <div className="divide-y divide-white/[0.04] text-xs">
                  {liveLedger.map((row) => (
                    <div
                      key={row.id}
                      className="py-3 flex items-center justify-between hover:bg-white/[0.01] px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-[#737373]">{row.time}</span>
                        <div>
                          <div className="font-medium text-[#fdfdfd] flex items-center gap-2">
                            {row.description}
                            <span className="font-mono text-[10px] text-[#737373]">{row.id}</span>
                          </div>
                          <span className="text-[11px] text-[#a3a3a3]">{row.division}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-medium text-sm text-[#fdfdfd] block">
                          {row.amount}
                        </span>
                        <span
                          className={`text-[11px] capitalize ${
                            row.status === "alert"
                              ? "text-[#ff1e42] font-medium"
                              : row.status === "pending"
                              ? "text-amber-400"
                              : "text-[#737373]"
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Field Simulation Input */}
              <div className="lg:col-span-4 surface-overlay p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider text-[#737373] font-medium">
                      Simulate Mobile Input
                    </span>
                    <Camera className="w-4 h-4 text-[#ff1e42]" />
                  </div>

                  <form onSubmit={handleSimulatedSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-[#737373] mb-1">Description</label>
                      <input
                        type="text"
                        value={simulatedDesc}
                        onChange={(e) => setSimulatedDesc(e.target.value)}
                        className="w-full bg-[#121212] border border-white/[0.08] rounded-full px-3.5 py-2 text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#737373] mb-1">Amount ($ USD)</label>
                      <input
                        type="number"
                        value={simulatedAmount}
                        onChange={(e) => setSimulatedAmount(e.target.value)}
                        className="w-full bg-[#121212] border border-white/[0.08] rounded-full px-3.5 py-2 text-xs text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                      />
                    </div>

                    {/* Scanner Simulation */}
                    <div className="relative h-20 rounded-[10px] bg-[#121212] border border-white/[0.06] overflow-hidden flex items-center justify-center">
                      <div className="scanner-beam absolute inset-0 bg-gradient-to-b from-transparent via-[#ff1e42]/20 to-transparent pointer-events-none" />
                      <span className="text-[11px] text-[#737373] flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-[#ff1e42]" />
                        Camera OCR Scan Simulation
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSimulating}
                      className="w-full btn-primary-crimson text-xs py-2.5"
                    >
                      {isSimulating ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Streaming to Google Drive...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          Log & Push to Drive
                        </span>
                      )}
                    </button>
                  </form>
                </div>

                {syncNotice && (
                  <div className="mt-4 p-3 rounded-[10px] bg-[#121212] border border-[#ff1e42]/40 text-xs text-[#d4d4d4] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ff1e42] shrink-0" />
                    <span>{syncNotice}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. SECTION: HOW IT WORKS */}
        <section id="how-it-works" className="mb-28">
          <div className="max-w-2xl mb-14">
            <span className="text-xs uppercase tracking-wider text-[#ff1e42] font-semibold block mb-2">
              System Architecture
            </span>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#fdfdfd] mb-4">
              How ClosedBook Works
            </h2>
            <p className="text-[#a3a3a3] text-base">
              A 4-step autonomous pipeline converting raw field expenses into structured Google Workspace assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="surface-panel p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#ff1e42] block mb-4">STEP 01</span>
                <h3 className="text-base font-medium text-[#fdfdfd] mb-2">Google OAuth 2.0</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Project Owner authorizes ClosedBook using native Google authentication. Zero proprietary
                  passwords or database credential silos.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-[#737373] font-mono">
                Scope: drive.file
              </div>
            </div>

            <div className="surface-panel p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#ff1e42] block mb-4">STEP 02</span>
                <h3 className="text-base font-medium text-[#fdfdfd] mb-2">Autonomous Vault</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  ClosedBook automatically provisions structured folders inside your Google Drive and creates the
                  live Master Ledger spreadsheet.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-[#737373] font-mono">
                100% User-Owned
              </div>
            </div>

            <div className="surface-panel p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#ff1e42] block mb-4">STEP 03</span>
                <h3 className="text-base font-medium text-[#fdfdfd] mb-2">Client Compression</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Crew members snap receipts on mobile. The PWA compresses photos locally to ~300KB and scrubs
                  GPS/EXIF data before transmission.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-[#737373] font-mono">
                Bandwidth Efficient
              </div>
            </div>

            <div className="surface-panel p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#ff1e42] block mb-4">STEP 04</span>
                <h3 className="text-base font-medium text-[#fdfdfd] mb-2">Dual-Stream Sync</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  The receipt image uploads straight into your Drive folder, and a formatted transaction row appends
                  instantly into your master Google Sheet.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-[#737373] font-mono">
                Accountant Ready
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECTION: DATA SOVEREIGNTY & SECURITY */}
        <section id="security" className="mb-28">
          <div className="max-w-2xl mb-14">
            <span className="text-xs uppercase tracking-wider text-[#ff1e42] font-semibold block mb-2">
              Security Protocol
            </span>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#fdfdfd] mb-4">
              Data Sovereignty & Privacy
            </h2>
            <p className="text-[#a3a3a3] text-base">
              Engineered with extreme cryptographic restraint. Your sensitive operational files never enter
              our infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="surface-panel p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#181818] border border-white/[0.08] flex items-center justify-center mb-6">
                  <ServerOff className="w-5 h-5 text-[#ff1e42]" />
                </div>
                <h3 className="text-lg font-medium text-[#fdfdfd] mb-3">
                  Zero Server Data Retention
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  ClosedBook does not host, duplicate, or store your project files, invoices, or accounting records.
                  All physical assets reside strictly in your personal Google Workspace. If ClosedBook ceases
                  operations, 100% of your production ledger remains intact in your Drive.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-[#ff1e42]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero vendor lock-in guarantee</span>
              </div>
            </div>

            <div className="surface-panel p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#181818] border border-white/[0.08] flex items-center justify-center mb-6">
                  <EyeOff className="w-5 h-5 text-[#ff1e42]" />
                </div>
                <h3 className="text-lg font-medium text-[#fdfdfd] mb-3">
                  Sandboxed Permissions (<code className="text-[#ff1e42]">drive.file</code>)
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  ClosedBook requests only the sandboxed <code className="text-[#fdfdfd]">drive.file</code> scope.
                  Under Google&apos;s technical security policies, ClosedBook cannot view, access, or modify any existing
                  photos, documents, or folders outside of the exact workspace it provisions for you.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-[#ff1e42]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Personal files isolated completely</span>
              </div>
            </div>

            <div className="surface-panel p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#181818] border border-white/[0.08] flex items-center justify-center mb-6">
                  <Cpu className="w-5 h-5 text-[#ff1e42]" />
                </div>
                <h3 className="text-lg font-medium text-[#fdfdfd] mb-3">
                  Client-Side EXIF & Location Stripping
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Before a photo leaves a crew member&apos;s phone, our WebAssembly compression pipeline strips GPS
                  coordinates, camera serial numbers, and device telemetry directly in browser memory, protecting
                  confidential set locations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-[#ff1e42]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confidential location protection</span>
              </div>
            </div>

            <div className="surface-panel p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#181818] border border-white/[0.08] flex items-center justify-center mb-6">
                  <ShieldCheck className="w-5 h-5 text-[#ff1e42]" />
                </div>
                <h3 className="text-lg font-medium text-[#fdfdfd] mb-3">
                  Google-Backed OAuth 2.0 PKCE
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  All session tokens are exchanged directly with Google Identity using PKCE protocols and
                  AES-256 encrypted refresh handshakes. ClosedBook never collects, handles, or stores raw passwords.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-[#ff1e42]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Banking-grade token exchange</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Editorial Prose Statement */}
        <section className="mb-28 max-w-3xl">
          <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold block mb-4">
            The Free-Tier Manifesto
          </span>
          <p className="editorial-copy mb-6">
            Traditional production software charges $20 per crew member per month to rent cloud storage you already
            own. ClosedBook eliminates the toll booth.
          </p>
          <p className="text-base text-[#a3a3a3] leading-relaxed">
            By turning your existing Google Workspace quota into a native production operating system, we allow
            independent filmmakers, creative studios, and event coordinators to scale infinitely with zero overhead.
          </p>
        </section>

        {/* 7. Bottom CTA Banner */}
        <section className="surface-panel p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4">
            Take command of your field operations.
          </h2>
          <p className="text-[#a3a3a3] text-sm md:text-base max-w-lg mx-auto mb-8">
            Connect your Google account and deploy your production ledger in less than 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/workspace" className="btn-primary-crimson text-sm px-8 py-3.5">
              Launch Production Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/kikirachmat2/closedbook"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost-pill text-sm px-6 py-3.5"
            >
              View GitHub Repository
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>

      {/* 8. Minimalist Footer */}
      <footer className="border-t border-white/[0.06] py-10 text-xs text-[#737373]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full overflow-hidden bg-[#121212] border border-white/[0.08] flex items-center justify-center">
              <Image src="/icon.png" alt="ClosedBook Logo" width={20} height={20} className="object-cover" />
            </div>
            <span className="text-[#fdfdfd] font-medium">closedbook.</span>
            <span>— The Zero-Budget Production & Project Management OS</span>
          </div>

          <div className="flex items-center gap-6 text-[#a3a3a3]">
            <span>Google Drive API v3</span>
            <span>•</span>
            <span>Google Sheets API v4</span>
            <span>•</span>
            <span>Next.js 15 PWA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
