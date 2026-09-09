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
  Lock,
  ExternalLink,
  Camera,
  Smartphone,
  ServerOff,
  EyeOff,
  Cpu,
  RefreshCw,
} from "lucide-react";

type PersonaId = "film" | "agency" | "event" | "student" | "general";

interface PersonaConfig {
  id: PersonaId;
  label: string;
  badge: string;
  subtitle: string;
  icon: React.ElementType;
  previewTitle: string;
  driveFolder: string[];
  sampleSheet: Array<{
    col1: string;
    col2: string;
    col3: string;
    col4: string;
    col5: string;
  }>;
}

const PERSONAS: Record<PersonaId, PersonaConfig> = {
  film: {
    id: "film",
    label: "Film & Video",
    badge: "Film Production",
    subtitle: "Producer, Line Producer, UPM & Departemen Syuting",
    icon: Clapperboard,
    previewTitle: "Feature Film: 'Senja di Balik Layar' (Day 4 of 16)",
    driveFolder: [
      "📁 01_Petty_Cash_Receipts (Foto Bon)",
      "📁 02_Daily_Call_Sheets",
      "📁 03_Deal_Memos_Talent_Crew",
      "📁 04_Equipment_Rental_Checklist",
    ],
    sampleSheet: [
      { col1: "14:20", col2: "Unit / Transport", col3: "Solar Genset Lokasi", col4: "Rp 1.250.000", col5: "Approved" },
      { col1: "18:05", col2: "Konsumsi", col3: "Makan Malam Kru (35 Pax)", col4: "Rp 1.050.000", col5: "Pending UPM" },
      { col1: "11:30", col2: "Artistic Dept", col3: "Cat Tembok & Properti Set", col4: "Rp 450.000", col5: "No Receipt" },
    ],
  },
  agency: {
    id: "agency",
    label: "Office & Agency",
    badge: "Client & Creative",
    subtitle: "Agensi kreatif, software studio & tim retainer",
    icon: Building2,
    previewTitle: "Agency Workspace: 'Q4 Brand Revamp Campaign'",
    driveFolder: [
      "📁 01_Invoices_&_Vendor_Bills",
      "📁 02_Client_Contracts_&_SOW",
      "📁 03_Deliverables_Approval",
      "📁 04_Team_Reimbursements",
    ],
    sampleSheet: [
      { col1: "09:30", col2: "Design Ops", col3: "Font Licensing & Assets", col4: "Rp 3.400.000", col5: "Matched PO" },
      { col1: "13:15", col2: "Audio Studio", col3: "VO Talent Session #2", col4: "Rp 5.000.000", col5: "Approved" },
      { col1: "16:40", col2: "Account Exec", col3: "Client Dinner Pitch", col4: "Rp 1.850.000", col5: "In Review" },
    ],
  },
  event: {
    id: "event",
    label: "Event Organizer",
    badge: "Festival & Live Events",
    subtitle: "Konser, festival, exhibition & wedding coordinator",
    icon: PartyPopper,
    previewTitle: "Live Festival: 'Soundwave 2026' (Loading-In)",
    driveFolder: [
      "📁 01_Bukti_Transfer_Vendor",
      "📁 02_Izin_Keramaian_&_Venue",
      "📁 03_Rundown_&_Emergency_Contact",
      "📁 04_Kuitansi_Kasbon_Divisi",
    ],
    sampleSheet: [
      { col1: "10:00", col2: "Perlengkapan", col3: "Rigging & Truss Panggung", col4: "Rp 18.000.000", col5: "Full Paid" },
      { col1: "11:20", col2: "Konsumsi", col3: "Uang Muka Catering (120 Pax)", col4: "Rp 6.000.000", col5: "Stamped" },
      { col1: "14:10", col2: "LO / Lapangan", col3: "Retribusi Kebersihan Venue", col4: "Rp 750.000", col5: "Cash Handed" },
    ],
  },
  student: {
    id: "student",
    label: "Campus & Org",
    badge: "Student & Community",
    subtitle: "BEM, panitia acara kampus & bendahara organisasi",
    icon: GraduationCap,
    previewTitle: "Kepanitiaan: 'Pekan Raya Mahasiswa & LPJ'",
    driveFolder: [
      "📁 01_Nota_Asli_LPJ (Scan/Foto)",
      "📁 02_Proposal_&_Surat_Izin",
      "📁 03_Dokumentasi_Kwitansi",
      "📁 04_Template_Laporan_Akhir",
    ],
    sampleSheet: [
      { col1: "08:45", col2: "Pubdok", col3: "Cetak Banner & Lanyard", col4: "Rp 1.450.000", col5: "LPJ Ready" },
      { col1: "12:00", col2: "Konsumsi", col3: "Snack Box Pembicara", col4: "Rp 250.000", col5: "Verified" },
      { col1: "15:30", col2: "Perlengkapan", col3: "Sewa Sound Portable", col4: "Rp 600.000", col5: "Verified" },
    ],
  },
  general: {
    id: "general",
    label: "Freelance & Solo",
    badge: "Solo Ops",
    subtitle: "Freelancer, konsultan & kreator independen",
    icon: Sparkles,
    previewTitle: "Solo Studio: 'Direct Expenses & Tax Cloud'",
    driveFolder: [
      "📁 01_Receipts_&_Expenses",
      "📁 02_Client_Contracts",
      "📁 03_Tax_Documents",
      "📁 04_Project_Archives",
    ],
    sampleSheet: [
      { col1: "10:15", col2: "Software", col3: "Cloud Database Monthly", col4: "Rp 420.000", col5: "Tax Ready" },
      { col1: "14:00", col2: "Equipment", col3: "SSD Backup 2TB", col4: "Rp 1.850.000", col5: "Stored" },
      { col1: "17:30", col2: "Workspace", col3: "Day Pass Co-working", col4: "Rp 150.000", col5: "Categorized" },
    ],
  },
};

export default function HomePage() {
  const [activePersona, setActivePersona] = useState<PersonaId>("film");
  const [activeTab, setActiveTab] = useState<"how" | "security">("how");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedDesc, setSimulatedDesc] = useState("Beli bensin unit & solar genset");
  const [simulatedAmount, setSimulatedAmount] = useState("450000");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const persona = PERSONAS[activePersona];

  const handleSimulateSync = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSyncStatus("Mengompresi foto bon (300KB) & menulis baris ke Google Sheet...");

    setTimeout(() => {
      setIsSimulating(false);
      setSyncStatus("✓ Berhasil: Foto tersimpan di Google Drive & data masuk di Google Sheet Anda.");
      setTimeout(() => setSyncStatus(null), 4000);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#fdfdfd] selection:bg-[#ff1e42] selection:text-[#ffffff]">
      {/* Ambient Red Glow */}
      <div className="ambient-glow" />

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-[#050505]/85 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#2a2a2a] bg-[#121212] flex items-center justify-center shadow-[0_0_15px_rgba(255,30,66,0.3)]">
              <Image
                src="/icon.png"
                alt="Closebook Red Quill Icon"
                width={36}
                height={36}
                className="object-cover"
                priority
              />
            </div>
            <span className="text-xl font-medium tracking-tight text-[#fdfdfd]">
              closebook<span className="text-[#ff1e42]">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#d4d4d4]">
            <a href="#how-it-works" className="hover:text-[#ff1e42] transition-colors">
              Cara Kerja
            </a>
            <a href="#security" className="hover:text-[#ff1e42] transition-colors">
              Keamanan Data
            </a>
            <a href="#workflow" className="hover:text-[#ff1e42] transition-colors">
              Preset Industri
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#how-it-works"
              className="btn-primary-red text-xs md:text-sm py-2.5 px-5"
            >
              Lihat Cara Kerja
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6 pt-16 md:pt-24 pb-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121212] border border-[#ff1e42]/30 text-[#d4d4d4] text-[13px] font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#ff1e42] animate-pulse" />
            Jembatan Langsung ke Google Drive & Sheets Anda
          </div>

          <h1 className="display-headline mb-6">
            Kelola project tanpa sewa server penyimpanan.
          </h1>

          <p className="subhead-caption max-w-2xl mx-auto mb-8 text-[#d4d4d4]">
            Kru di lapangan mencatat kasbon dan memotret struk via HP; semua file dan rekapan otomatis masuk langsung ke Google Drive dan Google Sheets milik Anda sendiri.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#how-it-works" className="btn-primary-red text-base px-8 py-3.5">
              Pelajari Alur Sistem
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#security" className="btn-ghost-pill text-base px-6 py-3.5">
              Uji Keamanan Data
              <ShieldCheck className="w-4 h-4 text-[#ff1e42]" />
            </a>
          </div>
        </div>

        {/* 3. SECTION: BAGAIMANA SISTEM INI BEKERJA */}
        <section id="how-it-works" className="mb-24 pt-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#ff1e42] block mb-2">
              Arsitektur Alur Kerja
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[#fdfdfd]">
              Bagaimana Closebook Bekerja?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            {/* Step 1 */}
            <div className="surface-card p-6 border-t-2 border-t-[#ff1e42]/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-[#ff1e42] bg-[#ff1e42]/10 px-2.5 py-1 rounded-full">
                    LANGKAH 01
                  </span>
                  <Lock className="w-4 h-4 text-[#737373]" />
                </div>
                <h3 className="text-base font-medium text-[#fdfdfd] mb-2">Login Google</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Project Owner masuk via Google OAuth. Sistem hanya meminta hak kelola file yang dibuat oleh Closebook.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1a1a1a] text-[11px] text-[#737373]">
                Scope: drive.file (Aman)
              </div>
            </div>

            {/* Step 2 */}
            <div className="surface-card p-6 border-t-2 border-t-[#ff1e42]/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-[#ff1e42] bg-[#ff1e42]/10 px-2.5 py-1 rounded-full">
                    LANGKAH 02
                  </span>
                  <HardDrive className="w-4 h-4 text-[#737373]" />
                </div>
                <h3 className="text-base font-medium text-[#fdfdfd] mb-2">Auto-Generate Vault</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Sistem otomatis membuat folder struktur di Google Drive Anda dan Google Sheet laporan keuangan utama.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1a1a1a] text-[11px] text-[#737373]">
                100% Milik Akun Anda
              </div>
            </div>

            {/* Step 3 */}
            <div className="surface-card p-6 border-t-2 border-t-[#ff1e42]/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-[#ff1e42] bg-[#ff1e42]/10 px-2.5 py-1 rounded-full">
                    LANGKAH 03
                  </span>
                  <Camera className="w-4 h-4 text-[#737373]" />
                </div>
                <h3 className="text-base font-medium text-[#fdfdfd] mb-2">Input Lapangan (PWA)</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Kru memotret bon di lokasi. Gambar dikompresi otomatis di browser HP menjadi ~300KB sebelum diunggah.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1a1a1a] text-[11px] text-[#737373]">
                Hemat Kuota & Cepat
              </div>
            </div>

            {/* Step 4 */}
            <div className="surface-card p-6 border-t-2 border-t-[#ff1e42]/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-[#ff1e42] bg-[#ff1e42]/10 px-2.5 py-1 rounded-full">
                    LANGKAH 04
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-[#737373]" />
                </div>
                <h3 className="text-base font-medium text-[#fdfdfd] mb-2">Sinkronisasi Instan</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Foto langsung tersimpan ke Google Drive Anda, dan baris pengeluaran tertulis otomatis di Google Sheets.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1a1a1a] text-[11px] text-[#737373]">
                Akuntan Langsung Bisa Cek
              </div>
            </div>
          </div>

          {/* Interactive Live Simulator Frame */}
          <div className="surface-card p-6 md:p-8 border border-[#1a1a1a]">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-[#1a1a1a] gap-4">
              <div>
                <span className="text-xs font-mono text-[#ff1e42] uppercase tracking-wider block mb-1">
                  Live Simulation
                </span>
                <h3 className="text-lg font-medium text-[#fdfdfd]">
                  Coba Simulasi Penginputan Transaksi Lapangan
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff1e42] animate-ping" />
                <span className="text-xs text-[#d4d4d4]">Target: Google Drive & Sheets Pribadi</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Input Simulation */}
              <div className="lg:col-span-5 surface-overlay p-5">
                <form onSubmit={handleSimulateSync} className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#a3a3a3] mb-1.5">Deskripsi Biaya</label>
                    <input
                      type="text"
                      value={simulatedDesc}
                      onChange={(e) => setSimulatedDesc(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#a3a3a3] mb-1.5">Nominal (IDR)</label>
                    <input
                      type="number"
                      value={simulatedAmount}
                      onChange={(e) => setSimulatedAmount(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm text-[#fdfdfd] focus:outline-none focus:border-[#ff1e42]"
                    />
                  </div>

                  {/* Simulated Receipt Preview with Scanner Line */}
                  <div className="relative h-24 rounded-[14px] bg-[#121212] border border-[#2a2a2a] overflow-hidden flex items-center justify-center">
                    <div className="scanner-beam absolute inset-0 bg-gradient-to-b from-transparent via-[#ff1e42]/20 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                      <Camera className="w-4 h-4 text-[#ff1e42]" />
                      <span>Simulasi Kamera Struk Bon Lapangan</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSimulating}
                    className="w-full btn-primary-red text-sm py-2.5"
                  >
                    {isSimulating ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sinkronisasi ke Drive & Sheet...
                      </span>
                    ) : (
                      <span>Simulasikan Kirim Bon</span>
                    )}
                  </button>
                </form>

                {syncStatus && (
                  <div className="mt-3 p-3 rounded-[14px] bg-[#121212] border border-[#ff1e42]/40 text-xs text-[#d4d4d4] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ff1e42] shrink-0" />
                    <span>{syncStatus}</span>
                  </div>
                )}
              </div>

              {/* Realtime Output to Google Sheet preview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
                  <span>Preview Data di Google Sheets Akun Anda:</span>
                  <span className="font-mono text-[#ff1e42]">Live Sync</span>
                </div>

                <div className="surface-overlay p-4 overflow-x-auto font-mono text-xs">
                  <div className="grid grid-cols-5 gap-2 text-[#737373] pb-2 border-b border-[#2a2a2a] font-semibold text-[11px]">
                    <span>JAM</span>
                    <span>DIVISI</span>
                    <span>DESKRIPSI</span>
                    <span>NOMINAL</span>
                    <span>STATUS</span>
                  </div>

                  <div className="divide-y divide-[#2a2a2a]/60">
                    <div className="grid grid-cols-5 gap-2 py-2.5 text-[#ff1e42] bg-[#ff1e42]/5 px-1 rounded">
                      <span>Baru saja</span>
                      <span>Lapangan</span>
                      <span className="truncate">{simulatedDesc}</span>
                      <span>Rp {Number(simulatedAmount || 0).toLocaleString("id-ID")}</span>
                      <span className="text-[#ff1e42] font-semibold">Tersimpan</span>
                    </div>

                    {persona.sampleSheet.map((row, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 py-2.5 text-[#d4d4d4] px-1">
                        <span className="text-[#737373]">{row.col1}</span>
                        <span>{row.col2}</span>
                        <span className="truncate">{row.col3}</span>
                        <span>{row.col4}</span>
                        <span className="text-[#a3a3a3]">{row.col5}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-[14px] bg-[#121212] border border-[#1a1a1a] flex items-center justify-between text-xs text-[#737373]">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-[#ff1e42]" />
                    Foto disimpan di: Google Drive/{persona.driveFolder[0]}
                  </span>
                  <span className="text-[#ff1e42]">100% Privacy</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SECTION: SEBERAPA AMAN SISTEM INI DIGUNAKAN */}
        <section id="security" className="mb-24 pt-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#ff1e42] block mb-2">
              Data Sovereignty & Privacy
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[#fdfdfd]">
              Seberapa Aman Sistem Ini Digunakan?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Security Pillar 1 */}
            <div className="surface-card p-8 border border-[#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-[#ff1e42]/10 border border-[#ff1e42]/30 flex items-center justify-center mb-6">
                  <ServerOff className="w-6 h-6 text-[#ff1e42]" />
                </div>
                <h3 className="text-lg font-medium text-[#fdfdfd] mb-3">
                  Zero Server Data Retention (Anti Keterikatan)
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Kami tidak menyimpan file struk, bon, atau dokumen proyek Anda di server Closebook. Seluruh data fisik disimpan langsung di Google Drive dan Google Sheets pribadi milik Anda. Jika layanan Closebook tutup sekalipun, seluruh data keuangan Anda tetap utuh 100% di akun Google Anda.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1a1a1a] flex items-center gap-2 text-xs text-[#ff1e42]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bebas dari risiko vendor lock-in</span>
              </div>
            </div>

            {/* Security Pillar 2 */}
            <div className="surface-card p-8 border border-[#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-[#ff1e42]/10 border border-[#ff1e42]/30 flex items-center justify-center mb-6">
                  <EyeOff className="w-6 h-6 text-[#ff1e42]" />
                </div>
                <h3 className="text-lg font-medium text-[#fdfdfd] mb-3">
                  Izin Terbatas Minimal: Scope <code className="text-[#ff1e42]">drive.file</code>
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Closebook menggunakan izin akses Google tervalidasi paling ketat. Sistem secara teknis <strong>TIDAK BISA</strong> membaca foto pribadi, email, atau file Google Drive Anda yang sudah ada sebelumnya. Sistem hanya memiliki akses ke folder yang khusus dibuat oleh aplikasi ini.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1a1a1a] flex items-center gap-2 text-xs text-[#ff1e42]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Privasi file pribadi terisolasi total</span>
              </div>
            </div>

            {/* Security Pillar 3 */}
            <div className="surface-card p-8 border border-[#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-[#ff1e42]/10 border border-[#ff1e42]/30 flex items-center justify-center mb-6">
                  <Cpu className="w-6 h-6 text-[#ff1e42]" />
                </div>
                <h3 className="text-lg font-medium text-[#fdfdfd] mb-3">
                  Kompresi Sisi Klien (Client-Side Compression)
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Foto bon dari kamera HP langsung dikompresi di memori browser HP kru sebelum dikirim melalui jaringan. Ini mencegah kebocoran metadata lokasi kamera (EXIF scrubbing) sekaligus menghemat pemakaian paket data seluler kru di lokasi terpencil.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1a1a1a] flex items-center gap-2 text-xs text-[#ff1e42]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Data EXIF sensitif otomatis dibersihkan</span>
              </div>
            </div>

            {/* Security Pillar 4 */}
            <div className="surface-card p-8 border border-[#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-[#ff1e42]/10 border border-[#ff1e42]/30 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-[#ff1e42]" />
                </div>
                <h3 className="text-lg font-medium text-[#fdfdfd] mb-3">
                  Autentikasi Standar Google OAuth 2.0 PKCE
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Tidak ada password akun Google yang pernah lewat atau disimpan di database kami. Autentikasi dan izin akses sepenuhnya dikontrol oleh infrastruktur keamanan Google dengan token sesi terenkripsi (AES-256).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1a1a1a] flex items-center gap-2 text-xs text-[#ff1e42]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Protokol keamanan setara perbankan</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECTION: WORKFLOW PRESET SELECTOR */}
        <section id="workflow" className="mb-20 pt-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#ff1e42] block mb-2">
              Preset Workflow
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[#fdfdfd]">
              Disesuaikan untuk Berbagai Jenis Proyek
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto p-1.5 rounded-full bg-[#121212] border border-[#1a1a1a] mb-8">
            {(Object.keys(PERSONAS) as PersonaId[]).map((key) => {
              const item = PERSONAS[key];
              const Icon = item.icon;
              const isActive = activePersona === key;
              return (
                <button
                  key={key}
                  onClick={() => setActivePersona(key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#1a1a1a] text-[#ffffff] border border-[#ff1e42]/60 shadow-[0_0_15px_rgba(255,30,66,0.2)]"
                      : "text-[#a3a3a3] hover:text-[#fdfdfd]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#ff1e42]" : "text-[#737373]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="surface-card p-6 md:p-8 border border-[#1a1a1a] max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1a1a1a]">
              <div>
                <h3 className="text-base font-medium text-[#fdfdfd]">{persona.previewTitle}</h3>
                <p className="text-xs text-[#a3a3a3] mt-0.5">{persona.subtitle}</p>
              </div>
              <span className="text-xs font-mono text-[#ff1e42] bg-[#ff1e42]/10 px-3 py-1 rounded-full">
                {persona.badge}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-[#737373] block mb-1">
                Folder yang otomatis dibuat di Google Drive Anda:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {persona.driveFolder.map((folder, i) => (
                  <div key={i} className="p-3 rounded-[10px] bg-[#121212] border border-[#2a2a2a] text-xs font-mono text-[#d4d4d4]">
                    {folder}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. CTA Footer Bar */}
        <section className="surface-card p-10 md:p-14 text-center border border-[#ff1e42]/30 bg-gradient-to-b from-[#121212] to-[#050505]">
          <h2 className="text-2xl md:text-4xl font-medium tracking-tight mb-4">
            Mulai kelola kas dan file project tanpa biaya langganan.
          </h2>
          <p className="text-sm md:text-base text-[#a3a3a3] max-w-xl mx-auto mb-8">
            Gunakan kuota Google Workspace Anda sendiri. Data tetap milik Anda selamanya.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/kikirachmat2/closebook"
              target="_blank"
              rel="noreferrer"
              className="btn-primary-red text-sm px-7 py-3"
            >
              Lihat Source Code di GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="border-t border-[#1a1a1a] py-8 text-xs text-[#737373]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#fdfdfd] font-medium">closebook.</span>
            <span>— Zero-Cost BYOS Production OS</span>
          </div>
          <div className="flex items-center gap-4 text-[#a3a3a3]">
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
