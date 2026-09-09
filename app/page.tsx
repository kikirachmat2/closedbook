"use client";

import React, { useState } from "react";
import Image from "next/image";
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
  Layers,
  ChevronRight,
  Clock,
  Plus,
  Lock,
  ExternalLink,
  Users,
  Camera,
} from "lucide-react";

// Persona Definition
type PersonaId = "film" | "agency" | "event" | "student" | "general";

interface PersonaConfig {
  id: PersonaId;
  label: string;
  badge: string;
  subtitle: string;
  icon: React.ElementType;
  previewTitle: string;
  stat1: { label: string; value: string; hint?: string };
  stat2: { label: string; value: string; hint?: string };
  stat3: { label: string; value: string; hint?: string };
  recentItems: Array<{
    id: string;
    title: string;
    departmentOrCategory: string;
    amountOrStatus: string;
    tag: string;
    isWarning?: boolean;
    date: string;
  }>;
  driveFolderStructure: string[];
  sheetColumns: string[];
}

const PERSONAS: Record<PersonaId, PersonaConfig> = {
  film: {
    id: "film",
    label: "Film & Video",
    badge: "Cinema & Production",
    subtitle: "Kru shooting, producer, line producer, UPM & departemen lapangan",
    icon: Clapperboard,
    previewTitle: "Feature Film: 'Senja di Balik Layar' — Day 4 of 16",
    stat1: { label: "UPM Floating Cash", value: "Rp 18.450.000", hint: "from Rp 25.000.000" },
    stat2: { label: "Today's Petty Cash", value: "Rp 4.320.000", hint: "12 transactions logged" },
    stat3: { label: "Missing Receipts", value: "1 Alert", hint: "Art Dept (Rp 450.000)" },
    recentItems: [
      {
        id: "TX-901",
        title: "BBM Genset & Solar Lokasi",
        departmentOrCategory: "Unit / Transport",
        amountOrStatus: "Rp 1.250.000",
        tag: "Approved by LP",
        date: "Today, 14:20",
      },
      {
        id: "TX-902",
        title: "Konsumsi Lembur Scene Malam (35 Pax)",
        departmentOrCategory: "Konsumsi",
        amountOrStatus: "Rp 1.050.000",
        tag: "In Review (UPM)",
        date: "Today, 18:05",
      },
      {
        id: "TX-903",
        title: "Cat Dulux & Properti Ruang Tamu",
        departmentOrCategory: "Artistic Dept",
        amountOrStatus: "Rp 450.000",
        tag: "No Receipt Photo",
        isWarning: true,
        date: "Today, 11:30",
      },
    ],
    driveFolderStructure: [
      "📁 01_Petty_Cash_Receipts (Foto Bon)",
      "📁 02_Daily_Call_Sheets",
      "📁 03_Deal_Memos_Talent_Crew",
      "📁 04_Sewa_Equipment_Checklist",
    ],
    sheetColumns: ["Tanggal", "Dept", "Keterangan", "Nominal", "Penerima", "Link Struk Drive", "Status UPM"],
  },
  agency: {
    id: "agency",
    label: "Office & Agency",
    badge: "Client & Creative",
    subtitle: "Agensi kreatif, software house, konsultan & tim retainer",
    icon: Building2,
    previewTitle: "Agency Workspace: 'Q4 Brand Revamp & Media Campaign'",
    stat1: { label: "Project Retainer", value: "Rp 85.000.000", hint: "Fixed fee contracted" },
    stat2: { label: "Disbursed Expenses", value: "Rp 21.800.000", hint: "25.6% burn rate" },
    stat3: { label: "Pending Invoices", value: "2 Client PO", hint: "Awaiting approval" },
    recentItems: [
      {
        id: "AG-101",
        title: "Figma Enterprise & Font Licensing",
        departmentOrCategory: "Design Operations",
        amountOrStatus: "Rp 3.400.000",
        tag: "Matched with PO",
        date: "Yesterday",
      },
      {
        id: "AG-102",
        title: "Voice Over Talent Session #2",
        departmentOrCategory: "Audio Production",
        amountOrStatus: "Rp 5.000.000",
        tag: "Approved",
        date: "2 days ago",
      },
      {
        id: "AG-103",
        title: "Client Working Dinner & Pitch Meet",
        departmentOrCategory: "Account Executive",
        amountOrStatus: "Rp 1.850.000",
        tag: "Reimbursement Pending",
        date: "3 days ago",
      },
    ],
    driveFolderStructure: [
      "📁 01_Invoices_&_Vendor_Bills",
      "📁 02_Client_Contracts_&_SOW",
      "📁 03_Deliverables_Approval",
      "📁 04_Team_Reimbursements",
    ],
    sheetColumns: ["Date", "Client", "Category", "Amount", "Vendor/Employee", "Receipt URL", "Audit Trail"],
  },
  event: {
    id: "event",
    label: "Event Organizer",
    badge: "Festival & Live Events",
    subtitle: "Konser musik, festival, pameran, wedding organizer & acara publik",
    icon: PartyPopper,
    previewTitle: "Festival Stage: 'Soundwave Fest 2026' — Loading-In",
    stat1: { label: "Cash on Venue", value: "Rp 42.000.000", hint: "Held by Event Director" },
    stat2: { label: "Vendor Down Payments", value: "Rp 130.500.000", hint: "Sound & Stage closed" },
    stat3: { label: "Permit Clearance", value: "100% Cleared", hint: "Venue & Police Permit" },
    recentItems: [
      {
        id: "EV-401",
        title: "Sewa Rigging & Truss Panggung Utama",
        departmentOrCategory: "Divisi Perlengkapan",
        amountOrStatus: "Rp 18.000.000",
        tag: "Full Paid",
        date: "Today, 10:00",
      },
      {
        id: "EV-402",
        title: "Uang Muka Catering Kru (120 Pax)",
        departmentOrCategory: "Divisi Konsumsi",
        amountOrStatus: "Rp 6.000.000",
        tag: "Receipt Stamped",
        date: "Today, 09:15",
      },
      {
        id: "EV-403",
        title: "Kupon Parkir & Retribusi Kebersihan",
        departmentOrCategory: "Divisi LO / Lapangan",
        amountOrStatus: "Rp 750.000",
        tag: "Cash Handed",
        date: "Yesterday",
      },
    ],
    driveFolderStructure: [
      "📁 01_Bukti_Transfer_Vendor",
      "📁 02_Izin_Keramaian_&_Venue",
      "📁 03_Rundown_&_Emergency_Contact",
      "📁 04_Kuitansi_Kasbon_Divisi",
    ],
    sheetColumns: ["Jam/Tgl", "Divisi", "Uraian Biaya", "Nominal", "PIC Lapangan", "Drive Bukti", "Status"],
  },
  student: {
    id: "student",
    label: "Campus & Org",
    badge: "Student & Non-Profit",
    subtitle: "BEM, himpunan mahasiswa, panitia acara kampus, komunitas & LPJ",
    icon: GraduationCap,
    previewTitle: "Kepanitiaan: 'Pekan Raya Mahasiswa & Bakti Kampus'",
    stat1: { label: "Kas Panitia", value: "Rp 12.800.000", hint: "Iuran + Sponsorship" },
    stat2: { label: "Belanja Seksi", value: "Rp 5.640.000", hint: "Siap diexport ke LPJ" },
    stat3: { label: "Bon Validated", value: "98% Matched", hint: "Bendahara Verified" },
    recentItems: [
      {
        id: "MHS-01",
        title: "Cetak Banner, ID Card & Lanyard",
        departmentOrCategory: "Seksi Publikasi / Dok",
        amountOrStatus: "Rp 1.450.000",
        tag: "LPJ Ready",
        date: "2 days ago",
      },
      {
        id: "MHS-02",
        title: "Snack Box Pembicara Seminar (5 Pax)",
        departmentOrCategory: "Seksi Konsumsi",
        amountOrStatus: "Rp 250.000",
        tag: "Verified",
        date: "3 days ago",
      },
      {
        id: "MHS-03",
        title: "Sewa Sound Portable Gladi Bersih",
        departmentOrCategory: "Seksi Perlengkapan",
        amountOrStatus: "Rp 600.000",
        tag: "Verified",
        date: "4 days ago",
      },
    ],
    driveFolderStructure: [
      "📁 01_Nota_Asli_LPJ (Scan/Foto)",
      "📁 02_Proposal_&_Surat_Izin",
      "📁 03_Dokumentasi_Kwitansi",
      "📁 04_Template_Laporan_Akhir",
    ],
    sheetColumns: ["No", "Tanggal", "Seksi/Sie", "Uraian", "Debet", "Kredit", "Bukti Drive", "Status Bendahara"],
  },
  general: {
    id: "general",
    label: "Freelance & Solo",
    badge: "General Workspace",
    subtitle: "Freelancer, solopreneur, kreator konten & pengelolaan proyek umum",
    icon: Sparkles,
    previewTitle: "Personal Ops: 'Client Retainers & Studio Expenses'",
    stat1: { label: "Monthly Cashflow", value: "+ Rp 24.500.000", hint: "Net positive" },
    stat2: { label: "Tax Deductible Receipts", value: "48 Items", hint: "Auto-synced to Drive" },
    stat3: { label: "Active Milestones", value: "4 Projects", hint: "All on track" },
    recentItems: [
      {
        id: "SOLO-01",
        title: "Domain Renewal & Cloud Subscription",
        departmentOrCategory: "Infrastructure",
        amountOrStatus: "Rp 420.000",
        tag: "Synced",
        date: "May 12",
      },
      {
        id: "SOLO-02",
        title: "MacBook Adapter & Hardware Tool",
        departmentOrCategory: "Equipment",
        amountOrStatus: "Rp 850.000",
        tag: "Receipt Stored",
        date: "May 08",
      },
      {
        id: "SOLO-03",
        title: "Co-working Pass & Client Meeting",
        departmentOrCategory: "Travel & Ops",
        amountOrStatus: "Rp 320.000",
        tag: "Categorized",
        date: "May 02",
      },
    ],
    driveFolderStructure: [
      "📁 01_Receipts_&_Expenses",
      "📁 02_Client_Contracts",
      "📁 03_Tax_Documents",
      "📁 04_Project_Archives",
    ],
    sheetColumns: ["Date", "Category", "Item Description", "Amount", "Tax Status", "Drive Link"],
  },
};

export default function HomePage() {
  const [activePersona, setActivePersona] = useState<PersonaId>("film");
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [mockTransactions, setMockTransactions] = useState(PERSONAS[activePersona].recentItems);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [driveSyncNotice, setDriveSyncNotice] = useState<string | null>(null);

  // Switch persona handler
  const handlePersonaSelect = (id: PersonaId) => {
    setActivePersona(id);
    setMockTransactions(PERSONAS[id].recentItems);
  };

  // Quick transaction logger simulation
  const handleSimulatedAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseName || !newExpenseAmount) return;

    setIsSimulatingUpload(true);
    setDriveSyncNotice("Compressing receipt image & appending row to your Google Sheet...");

    setTimeout(() => {
      const newItem = {
        id: `TX-${Math.floor(100 + Math.random() * 900)}`,
        title: newExpenseName,
        departmentOrCategory: activePersona === "film" ? "Kamera / Art" : "Operational",
        amountOrStatus: `Rp ${Number(newExpenseAmount).toLocaleString("id-ID")}`,
        tag: "Uploaded to Drive",
        date: "Just now",
      };

      setMockTransactions([newItem, ...mockTransactions]);
      setIsSimulatingUpload(false);
      setNewExpenseName("");
      setNewExpenseAmount("");
      setDriveSyncNotice("✓ Stored in your Google Drive & synced to Google Sheet!");

      setTimeout(() => setDriveSyncNotice(null), 4000);
    }, 900);
  };

  const persona = PERSONAS[activePersona];

  return (
    <div className="min-h-screen bg-[#050505] text-[#fdfdfd] selection:bg-[#1500ff] selection:text-[#fdfdfd]">
      {/* 1. Minimal Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#050505]/80 backdrop-blur-md border-b border-[#1e1e1e]/60">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand with Quill Pen Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#2f2f2f] bg-[#151515] flex items-center justify-center">
              <Image
                src="/quill-icon.jpg"
                alt="Closebook Quill Pen Logo"
                width={36}
                height={36}
                className="object-cover"
                priority
              />
            </div>
            <span className="text-xl font-medium tracking-tight text-[#fdfdfd]">
              closebook<span className="text-[#1500ff]">.</span>
            </span>
          </div>

          {/* Centered Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#d4d4d4]">
            <a href="#how-it-works" className="hover:text-[#fdfdfd] transition-colors">
              How it works
            </a>
            <a href="#byos" className="hover:text-[#fdfdfd] transition-colors">
              BYOS Architecture
            </a>
            <a href="#personas" className="hover:text-[#fdfdfd] transition-colors">
              Use Cases
            </a>
            <a href="#github" className="hover:text-[#fdfdfd] transition-colors">
              Open Source
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="btn-ghost-pill text-xs md:text-sm"
            >
              Select Persona
            </button>
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="btn-primary-indigo text-xs md:text-sm"
            >
              Start Closing Books
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: 96px Sculptural Headline + Obsidian Canvas */}
      <main className="max-w-[1200px] mx-auto px-6 pt-16 md:pt-28 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Subtle Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#151515] text-[#a3a3a3] text-[13px] font-medium mb-8 border border-[#2f2f2f]/60">
            <span className="w-2 h-2 rounded-full bg-[#1500ff] animate-pulse" />
            The Zero-Budget Production & Project OS
          </div>

          {/* 96px Sculptural Display Headline */}
          <h1 className="display-headline mb-8">
            Close the books on messy productions.
          </h1>

          {/* Subhead Caption */}
          <p className="subhead-caption max-w-2xl mx-auto mb-10 text-[#d4d4d4]">
            A clean black canvas connecting your team directly to your own Google Drive & Google Sheets.
            Zero server storage cost, no lost receipts, and full audit control.
          </p>

          {/* Single Electric Indigo Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="btn-primary-indigo text-base px-8 py-3.5"
            >
              Get Started with Google Workspace
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#personas"
              className="btn-ghost-pill text-base px-6 py-3.5"
            >
              Explore Persona Presets
            </a>
          </div>
        </div>

        {/* 3. Dynamic Persona Tabs Switcher */}
        <div id="personas" className="mb-8 pt-4">
          <div className="text-center mb-6">
            <span className="text-[13px] tracking-wider uppercase text-[#737373] font-medium">
              Choose your workflow preset
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto p-1.5 rounded-full bg-[#151515] border border-[#1e1e1e]">
            {(Object.keys(PERSONAS) as PersonaId[]).map((key) => {
              const item = PERSONAS[key];
              const Icon = item.icon;
              const isActive = activePersona === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePersonaSelect(key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#1e1e1e] text-[#fdfdfd] border border-[#2f2f2f]"
                      : "text-[#a3a3a3] hover:text-[#fdfdfd] hover:bg-[#1e1e1e]/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#1500ff]" : "text-[#737373]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Product Preview Frame (Charcoal #151515, 14px radius, no drop shadows) */}
        <div className="surface-card p-6 md:p-10 mb-20 border border-[#1e1e1e] transition-all">
          {/* Frame Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-[#2f2f2f]/60 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#2f2f2f]" />
              <div className="w-3 h-3 rounded-full bg-[#2f2f2f]" />
              <div className="w-3 h-3 rounded-full bg-[#2f2f2f]" />
              <div className="h-4 w-[1px] bg-[#2f2f2f] mx-2" />
              <div>
                <h3 className="text-lg font-medium text-[#fdfdfd] flex items-center gap-2">
                  {persona.previewTitle}
                  <span className="tag-pill bg-[#1e1e1e] text-[#d4d4d4] text-[12px] border border-[#2f2f2f]/60">
                    {persona.badge}
                  </span>
                </h3>
                <p className="text-xs text-[#a3a3a3] mt-0.5">{persona.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#737373] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1500ff]" />
                Connected to Owner's Google Drive
              </span>
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="surface-overlay p-5 border border-[#2f2f2f]/40">
              <span className="text-xs text-[#a3a3a3] block mb-1">{persona.stat1.label}</span>
              <span className="text-2xl font-medium tracking-tight text-[#fdfdfd] block mb-1">
                {persona.stat1.value}
              </span>
              <span className="text-xs text-[#737373]">{persona.stat1.hint}</span>
            </div>

            <div className="surface-overlay p-5 border border-[#2f2f2f]/40">
              <span className="text-xs text-[#a3a3a3] block mb-1">{persona.stat2.label}</span>
              <span className="text-2xl font-medium tracking-tight text-[#fdfdfd] block mb-1">
                {persona.stat2.value}
              </span>
              <span className="text-xs text-[#737373]">{persona.stat2.hint}</span>
            </div>

            <div className="surface-overlay p-5 border border-[#2f2f2f]/40">
              <span className="text-xs text-[#a3a3a3] block mb-1">{persona.stat3.label}</span>
              <span className="text-2xl font-medium tracking-tight text-[#fdfdfd] block mb-1">
                {persona.stat3.value}
              </span>
              <span className="text-xs text-[#737373]">{persona.stat3.hint}</span>
            </div>
          </div>

          {/* Interactive Simulation Panel & Live Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Quick Entry Form */}
            <div className="lg:col-span-5 surface-overlay p-6 border border-[#2f2f2f]/40">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-[#fdfdfd] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#1500ff]" />
                  Simulate Field Input
                </h4>
                <span className="text-[11px] text-[#737373] uppercase tracking-wider">Zero-Cost PWA</span>
              </div>

              <form onSubmit={handleSimulatedAddExpense} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#a3a3a3] mb-1.5">Item Description</label>
                  <input
                    type="text"
                    value={newExpenseName}
                    onChange={(e) => setNewExpenseName(e.target.value)}
                    placeholder={
                      activePersona === "film"
                        ? "e.g. Beli Properti Bunga Scene 12"
                        : "e.g. Snack Kopi Kru / Software Fee"
                    }
                    className="w-full bg-[#151515] border border-[#2f2f2f] rounded-full px-4 py-2.5 text-sm text-[#fdfdfd] placeholder-[#737373] focus:outline-none focus:border-[#1500ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#a3a3a3] mb-1.5">Amount (IDR)</label>
                  <input
                    type="number"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    placeholder="e.g. 350000"
                    className="w-full bg-[#151515] border border-[#2f2f2f] rounded-full px-4 py-2.5 text-sm text-[#fdfdfd] placeholder-[#737373] focus:outline-none focus:border-[#1500ff]"
                  />
                </div>

                <div className="p-3.5 rounded-[14px] bg-[#151515] border border-[#2f2f2f]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-[#1500ff]" />
                    <span className="text-xs text-[#d4d4d4]">Auto-compress Receipt (300KB)</span>
                  </div>
                  <span className="tag-pill bg-[#1e1e1e] text-[11px] text-[#a3a3a3]">Simulated</span>
                </div>

                <button
                  type="submit"
                  disabled={isSimulatingUpload || !newExpenseName || !newExpenseAmount}
                  className="w-full btn-primary-indigo text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSimulatingUpload ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Syncing to Drive & Sheets...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Save & Sync Instantly
                    </span>
                  )}
                </button>
              </form>

              {driveSyncNotice && (
                <div className="mt-4 p-3 rounded-[14px] bg-[#151515] border border-[#1500ff]/40 text-xs text-[#d4d4d4] flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#1500ff] shrink-0" />
                  <span>{driveSyncNotice}</span>
                </div>
              )}
            </div>

            {/* Right: Realtime Transaction & Audit Feed */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                  Live Ledger Activity
                </span>
                <span className="text-xs text-[#737373]">Auto-mirrored in Google Sheets</span>
              </div>

              {mockTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="surface-overlay p-4 border border-[#2f2f2f]/40 flex items-center justify-between transition-all hover:bg-[#252525]"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        tx.isWarning ? "bg-amber-950/40 text-amber-400" : "bg-[#151515] text-[#d4d4d4]"
                      }`}
                    >
                      {tx.isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#1500ff]" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#fdfdfd] flex items-center gap-2">
                        {tx.title}
                        <span className="text-[11px] text-[#737373] font-mono">{tx.id}</span>
                      </div>
                      <div className="text-xs text-[#a3a3a3] flex items-center gap-2 mt-0.5">
                        <span>{tx.departmentOrCategory}</span>
                        <span>•</span>
                        <span className="text-[#737373]">{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-medium text-[#fdfdfd] block">
                      {tx.amountOrStatus}
                    </span>
                    <span
                      className={`text-[11px] inline-block mt-0.5 ${
                        tx.isWarning ? "text-amber-400 font-medium" : "text-[#a3a3a3]"
                      }`}
                    >
                      {tx.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Editorial Body Block (36px Headline scale prose) */}
        <section className="mb-24">
          <div className="max-w-[840px]">
            <span className="text-[13px] text-[#737373] uppercase tracking-wider block mb-4 font-medium">
              The Architecture Philosophy
            </span>
            <p className="editorial-prose mb-8">
              We stopped building servers to hoard your production files. Instead, Closebook turns your own
              Google Drive and Sheets into an automated, high-velocity ledger with zero subscription costs.
            </p>
            <p className="text-base md:text-lg text-[#a3a3a3] leading-relaxed">
              When a crew member snaps a receipt at 2:00 AM on a muddy outdoor set, it doesn't upload to a
              bloated AWS bill. It compresses on their phone, lands directly into the Producer's Google Drive,
              and appends a structured row into the master Google Sheet. If Closebook ever vanished tomorrow,
              your production records remain 100% in your hands.
            </p>
          </div>
        </section>

        {/* 6. BYOS (Bring Your Own Storage) Architecture Deep Dive */}
        <section id="byos" className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[13px] text-[#1500ff] uppercase tracking-wider font-medium block mb-2">
              Zero-Budget Blueprint
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[#fdfdfd]">
              How Closebook bridges with your Google Workspace
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Drive Structure Box */}
            <div className="surface-card p-8 border border-[#1e1e1e]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-[#1500ff]" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#fdfdfd]">Google Drive Auto-Vault</h3>
                  <span className="text-xs text-[#a3a3a3]">Created under Project Owner's Account</span>
                </div>
              </div>

              <div className="surface-overlay p-4 font-mono text-xs text-[#d4d4d4] space-y-2 mb-6">
                <div className="text-[#fdfdfd] font-bold">📁 SetFlow_Closebook_{persona.label}</div>
                {persona.driveFolderStructure.map((folder, i) => (
                  <div key={i} className="pl-4 text-[#a3a3a3]">
                    {folder}
                  </div>
                ))}
              </div>

              <p className="text-sm text-[#a3a3a3] leading-relaxed">
                Uses the minimal <code className="text-[#fdfdfd]">drive.file</code> scope. Closebook can only see
                and manage folders it creates for your project — your personal files and photos remain completely private.
              </p>
            </div>

            {/* Google Sheets Structure Box */}
            <div className="surface-card p-8 border border-[#1e1e1e]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-[#1500ff]" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#fdfdfd]">Google Sheets Live Ledger</h3>
                  <span className="text-xs text-[#a3a3a3]">Realtime synchronized accounting</span>
                </div>
              </div>

              <div className="surface-overlay p-4 font-mono text-xs text-[#d4d4d4] mb-6 overflow-x-auto">
                <div className="text-[#fdfdfd] font-bold mb-2">📊 Master_Ledger_{persona.label}.xlsx</div>
                <div className="flex gap-2 text-[11px] text-[#a3a3a3] pb-2 border-b border-[#2f2f2f]">
                  {persona.sheetColumns.map((col, idx) => (
                    <span key={idx} className="bg-[#151515] px-2 py-1 rounded-[6px] shrink-0">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-[#a3a3a3] leading-relaxed">
                Execs and accountants can open familiar spreadsheets on their laptops, while field crew
                log transactions via a fast, native-feeling PWA interface with instant camera capture.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Partner / Trusted Strip (Quiet Grayscale Authority) */}
        <section className="mb-24 text-center">
          <span className="text-[13px] text-[#737373] block mb-8">
            Engineered for high-pressure production teams & creative collectives
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-[#a3a3a3] text-sm font-medium tracking-wide">
            <span className="hover:text-[#fdfdfd] transition-colors">INDEPENDENT FILMMAKERS</span>
            <span className="hover:text-[#fdfdfd] transition-colors">CREATIVE STUDIOS</span>
            <span className="hover:text-[#fdfdfd] transition-colors">EVENT PRODUCERS</span>
            <span className="hover:text-[#fdfdfd] transition-colors">CAMPUS COMMITTEES</span>
            <span className="hover:text-[#fdfdfd] transition-colors">FREELANCE COLLECTIVES</span>
          </div>
        </section>

        {/* 8. Call to Action Banner */}
        <section id="github" className="surface-card p-10 md:p-16 text-center border border-[#1e1e1e] mb-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6">
              Start your next production with zero overhead.
            </h2>
            <p className="text-[#d4d4d4] mb-8 text-base md:text-lg">
              No credit card required. No monthly tiers. Just connect your Google account and take command
              of your field operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsOnboardingModalOpen(true)}
                className="btn-primary-indigo text-base px-8 py-3.5"
              >
                Launch Closebook OS
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://github.com/frahmat68-beep/closebook"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost-pill text-base px-6 py-3.5"
              >
                View GitHub Repository
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Minimal Footer */}
      <footer className="border-t border-[#1e1e1e] py-12 text-[#737373] text-sm">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-[#2f2f2f] bg-[#151515] flex items-center justify-center">
              <Image
                src="/quill-icon.jpg"
                alt="Closebook Logo"
                width={24}
                height={24}
                className="object-cover"
              />
            </div>
            <span className="text-[#fdfdfd] font-medium">closebook</span>
            <span>— The zero-cost production management system</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#a3a3a3]">
            <span>Next.js 15 & Supabase</span>
            <span>•</span>
            <span>Google Drive & Sheets API</span>
            <span>•</span>
            <span>PWA Enabled</span>
          </div>
        </div>
      </footer>

      {/* 10. Interactive Persona Onboarding Modal */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="surface-card max-w-xl w-full p-8 border border-[#2f2f2f] relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsOnboardingModalOpen(false)}
              className="absolute top-6 right-6 text-[#737373] hover:text-[#fdfdfd] text-sm p-1"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2f2f2f] bg-[#151515] flex items-center justify-center">
                <Image src="/quill-icon.jpg" alt="Logo" width={40} height={40} className="object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-[#fdfdfd]">Welcome to Closebook</h3>
                <p className="text-xs text-[#a3a3a3]">How do you plan to run your projects?</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {(Object.keys(PERSONAS) as PersonaId[]).map((key) => {
                const item = PERSONAS[key];
                const Icon = item.icon;
                const isSelected = activePersona === key;
                return (
                  <div
                    key={key}
                    onClick={() => handlePersonaSelect(key)}
                    className={`p-4 rounded-[14px] cursor-pointer transition-all flex items-start gap-3.5 border ${
                      isSelected
                        ? "bg-[#1e1e1e] border-[#1500ff]"
                        : "bg-[#151515] border-[#2f2f2f]/60 hover:border-[#737373]"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full mt-0.5 ${
                        isSelected ? "bg-[#1500ff] text-white" : "bg-[#1e1e1e] text-[#a3a3a3]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#fdfdfd]">{item.label}</span>
                        {isSelected && <span className="text-xs text-[#1500ff] font-medium">Selected</span>}
                      </div>
                      <p className="text-xs text-[#a3a3a3] mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#2f2f2f]">
              <span className="text-xs text-[#737373] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1500ff]" />
                User-Owned Google Drive Scope
              </span>
              <button
                onClick={() => {
                  setIsOnboardingModalOpen(false);
                  const previewElem = document.getElementById("personas");
                  if (previewElem) {
                    previewElem.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="btn-primary-indigo text-xs py-2.5 px-6"
              >
                Apply Persona & Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
