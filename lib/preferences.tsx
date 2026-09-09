"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CurrencyCode = "USD" | "IDR" | "EUR" | "GBP" | "SGD" | "JPY";
export type LanguageCode = "en" | "id" | "es" | "ja";
export type ThemeCode = "obsidian" | "indigo" | "emerald" | "amber" | "paper";

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  rate: number; // relative to USD base
  decimals: number;
  prefix: string;
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", rate: 1, decimals: 2, prefix: "$", flag: "🇺🇸" },
  IDR: { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", rate: 15500, decimals: 0, prefix: "Rp ", flag: "🇮🇩" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", rate: 0.92, decimals: 2, prefix: "€", flag: "🇪🇺" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", rate: 0.78, decimals: 2, prefix: "£", flag: "🇬🇧" },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$", rate: 1.34, decimals: 2, prefix: "S$", flag: "🇸🇬" },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 150, decimals: 0, prefix: "¥", flag: "🇯🇵" },
};

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  id: { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  es: { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  ja: { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
};

export interface ThemeConfig {
  code: ThemeCode;
  name: string;
  description: string;
  accentColor: string;
  bgPreview: string;
  panelPreview: string;
}

export const THEMES: Record<ThemeCode, ThemeConfig> = {
  obsidian: {
    code: "obsidian",
    name: "Obsidian Crimson",
    description: "Pure #050505 Savee black canvas with electric crimson neon accents",
    accentColor: "#ff1e42",
    bgPreview: "#050505",
    panelPreview: "#121212",
  },
  indigo: {
    code: "indigo",
    name: "Cyber Indigo",
    description: "Deep obsidian canvas with electric cobalt indigo gallery lights",
    accentColor: "#3b82f6",
    bgPreview: "#04050a",
    panelPreview: "#0d111d",
  },
  emerald: {
    code: "emerald",
    name: "Emerald Terminal",
    description: "Matrix dark aesthetic with high-precision mint green accents",
    accentColor: "#10b981",
    bgPreview: "#030805",
    panelPreview: "#0a140f",
  },
  amber: {
    code: "amber",
    name: "Solar Amber",
    description: "Cinematic golden hour dark palette with warm tungsten amber",
    accentColor: "#f59e0b",
    bgPreview: "#090704",
    panelPreview: "#16120a",
  },
  paper: {
    code: "paper",
    name: "Architectural Paper",
    description: "Minimalist Swiss gallery light mode with high-contrast typography",
    accentColor: "#e11d48",
    bgPreview: "#f8f9fa",
    panelPreview: "#ffffff",
  },
};

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Brand & System
    appName: "closebook.",
    appTagline: "Modern Production & Project OS",
    activeProduction: "ACTIVE PRODUCTION",
    driveVaultSynced: "Drive Vault: Synced",
    synced: "Synced",
    logExpense: "Log Expense",
    preferences: "Preferences",
    currency: "Currency",
    language: "Language",
    theme: "Theme",
    dayCount: "Day {day} of {total}",
    syncActive: "Sync Active",
    settingsTitle: "Display & System Preferences",
    settingsSub: "Customize active currency, language localization, and interface theme palette.",
    close: "Close",
    savePreferences: "Save Preferences",

    // Nav Tabs
    tabOverview: "Executive Overview",
    tabLedger: "Petty Cash Ledger",
    tabPockets: "Multi-Pocket Cashflow",
    tabTasks: "Department Tasks",
    tabCallSheet: "Digital Call Sheet",
    tabEquipment: "Equipment Rental",
    tabAlerts: "Automated Alerts",
    tabSheet: "Google Sheet Mirror",

    // Executive Overview
    totalBudget: "Total Production Budget",
    budgetCommitted: "100% committed",
    disbursedToDepts: "Disbursed to Departments",
    burnRate: "burn rate",
    fieldCashOnHand: "UPM Field Cash on Hand",
    cashSufficient: "Sufficient for Day 4",
    activeAlerts: "Active Automated Alerts",
    auditRequired: "Audit required",
    deptBudgetRealization: "Department Budget Realization",
    deptBudgetSub: "Real-time spend tracking against departmental ceiling",
    recentEntries: "Recent Petty Cash Entries",
    viewAllLedger: "View All Ledger",
    activeFlags: "Active Production Flags",
    resolve: "Resolve",
    resolved: "Resolved",
    acknowledgeResolve: "Acknowledge & Resolve",

    // Ledger
    ledgerTitle: "Petty Cash Audit Ledger",
    ledgerSub: "BYOS Google Drive mirrored ledger with live photo attachments",
    searchPlaceholder: "Search by vendor, department, description, or TX...",
    filterAll: "All Entries",
    filterApproved: "Approved",
    filterPending: "Pending Approval",
    filterMissing: "Missing Receipt",
    colTx: "TX REF",
    colVendor: "VENDOR / DESCRIPTION",
    colDept: "DEPARTMENT",
    colPocket: "POCKET",
    colAmount: "AMOUNT",
    colReceipt: "RECEIPT PHOTO",
    colStatus: "STATUS",
    colActions: "ACTIONS",
    exportSheet: "Export to Sheets",

    // Pockets
    pocketsTitle: "Multi-Pocket Cashflow Hierarchy",
    pocketsSub: "Zero-leakage multi-tier fund disbursement from Master Vault to Field Crew",
    transferFunds: "Transfer Pocket Funds",
    custodian: "Custodian",
    remainingBalance: "Remaining Balance",
    totalAllocated: "Total Allocated",

    // Tasks
    tasksTitle: "Department Task Board",
    tasksSub: "Real-time coordination across Camera, Art, Grip, and Unit departments",
    newTask: "New Department Task",
    todo: "To-Do",
    inProgress: "In Progress",
    completed: "Completed",

    // Call Sheet
    callSheetTitle: "Digital Production Call Sheet",
    callSheetSub: "Daily shooting schedule, scene breakdowns, call times, and emergency contacts",
    callTime: "Call Time",
    estimatedWrap: "Estimated Wrap",
    location: "Location",
    weather: "Weather",
    emergencyContact: "Medic & Emergency",
    directorNotes: "Director & Producer Notes",

    // Modals
    modalExpenseTitle: "Log Petty Cash Expense",
    modalTransferTitle: "Transfer Pocket Funds",
    modalTaskTitle: "Create Department Task",
    formDesc: "Expense Description",
    formAmount: "Amount",
    formDept: "Department",
    formPocket: "Pocket",
    formVendor: "Vendor / Merchant",
    formAttachReceipt: "Attach Receipt Photo",
    formMissingReceiptCheck: "Flag receipt as missing (UPM approval required)",
    formSubmitExpense: "Record & Mirror to Drive",
    formSubmitTransfer: "Authorize & Disburse Cash",
    formSubmitTask: "Create & Assign Task",
    selectSourcePocket: "Source Pocket (From)",
    selectDestPocket: "Destination Pocket (To)",
    taskTitle: "Task Title",
    taskAssignee: "Assignee",
    taskPriority: "Priority",
    priorityLow: "Low",
    priorityMedium: "Medium",
    priorityHigh: "High",
    priorityUrgent: "Urgent",

    // Landing Page
    landingHeroEyebrow: "Production & Project Operating System",
    landingHeroHeadline: "Run Production on Google Infrastructure.",
    landingHeroSub: "Zero cloud database bills. Direct Google Drive receipt sync. Real-time Google Sheets reconciliation. Designed with extreme architectural minimalism for film crews, creative agencies, and fast-moving projects.",
    landingLaunchBtn: "Launch Production Workspace",
    landingExploreBtn: "Explore Interactive Demo",
    landingAuditReport: "View System & Design Audit Report",
  },
  id: {
    // Brand & System
    appName: "closebook.",
    appTagline: "OS Manajemen Produksi & Proyek Modern",
    activeProduction: "PRODUKSI AKTIF",
    driveVaultSynced: "Vault Drive: Tersinkron",
    synced: "Tersinkron",
    logExpense: "Catat Kas",
    preferences: "Pengaturan",
    currency: "Mata Uang",
    language: "Bahasa",
    theme: "Tema Tampilan",
    dayCount: "Hari {day} dari {total}",
    syncActive: "Sinkronisasi Aktif",
    settingsTitle: "Preferensi Tampilan & Sistem",
    settingsSub: "Sesuaikan mata uang aktif, bahasa antarmuka, dan palet warna tema sesuai kebutuhan tim.",
    close: "Tutup",
    savePreferences: "Terapkan Preferensi",

    // Nav Tabs
    tabOverview: "Ringkasan Eksekutif",
    tabLedger: "Buku Kas Lapangan",
    tabPockets: "Hierarki Kantong Dana",
    tabTasks: "Tugas Departemen",
    tabCallSheet: "Call Sheet Digital",
    tabEquipment: "Inventaris & Rental",
    tabAlerts: "Peringatan Otomatis",
    tabSheet: "Cermin Google Sheets",

    // Executive Overview
    totalBudget: "Total Anggaran Produksi",
    budgetCommitted: "100% teralokasi",
    disbursedToDepts: "Teralokasi ke Departemen",
    burnRate: "tingkat penyerapan",
    fieldCashOnHand: "Kas Tunai UPM Lapangan",
    cashSufficient: "Mencukupi untuk Hari ke-4",
    activeAlerts: "Peringatan Sistem Aktif",
    auditRequired: "Perlu audit segera",
    deptBudgetRealization: "Realisasi Anggaran Departemen",
    deptBudgetSub: "Pemantauan pengeluaran langsung terhadap pagu anggaran tiap departemen",
    recentEntries: "Pengeluaran Kas Terbaru",
    viewAllLedger: "Lihat Semua Buku Kas",
    activeFlags: "Peringatan Produksi Aktif",
    resolve: "Selesaikan",
    resolved: "Terselesaikan",
    acknowledgeResolve: "Verifikasi & Selesaikan",

    // Ledger
    ledgerTitle: "Buku Kas Lapangan & Audit Nota",
    ledgerSub: "Buku besar mirrored langsung ke Google Drive & Sheets milik tim tanpa perantara cloud berbayar",
    searchPlaceholder: "Cari berdasarkan toko, departemen, uraian, atau nomor TX...",
    filterAll: "Semua Transaksi",
    filterApproved: "Disetujui",
    filterPending: "Menunggu Persetujuan",
    filterMissing: "Nota Hilang",
    colTx: "KODE TX",
    colVendor: "TOKO / URAIAN BELANJA",
    colDept: "DEPARTEMEN",
    colPocket: "KANTONG",
    colAmount: "NOMINAL",
    colReceipt: "FOTO BUKTI NOTA",
    colStatus: "STATUS",
    colActions: "AKSI",
    exportSheet: "Ekspor ke Google Sheets",

    // Pockets
    pocketsTitle: "Hierarki Aliran Dana Multi-Kantong",
    pocketsSub: "Cegah kebocoran dana dengan pencairan bertingkat dari Brankas Produser ke Kru Lapangan",
    transferFunds: "Transfer Dana Kantong",
    custodian: "Penanggung Jawab",
    remainingBalance: "Sisa Saldo Kas",
    totalAllocated: "Total Plafon",

    // Tasks
    tasksTitle: "Papan Kerja Departemen",
    tasksSub: "Koordinasi real-time lintas divisi Kamera, Artistik, Lampu/Grip, dan Lapangan",
    newTask: "Buat Tugas Baru",
    todo: "Rencana",
    inProgress: "Sedang Dikerjakan",
    completed: "Selesai",

    // Call Sheet
    callSheetTitle: "Jadwal Call Sheet Digital",
    callSheetSub: "Jadwal panggilan syuting harian, rincian scene, cuaca, dan kontak darurat tim medis",
    callTime: "Waktu Panggilan (Call Time)",
    estimatedWrap: "Estimasi Selesai (Wrap)",
    location: "Lokasi Syuting",
    weather: "Kondisi Cuaca",
    emergencyContact: "Medis & Kontak Darurat",
    directorNotes: "Catatan Sutradara & Produser",

    // Modals
    modalExpenseTitle: "Catat Pengeluaran Kas Lapangan",
    modalTransferTitle: "Transfer Dana Antar-Kantong",
    modalTaskTitle: "Buat Tugas Kerja Departemen",
    formDesc: "Uraian Pengeluaran",
    formAmount: "Nominal",
    formDept: "Departemen",
    formPocket: "Kantong Kas",
    formVendor: "Nama Toko / Vendor",
    formAttachReceipt: "Lampirkan Foto Nota",
    formMissingReceiptCheck: "Tandai nota fisik hilang (perlu persetujuan UPM)",
    formSubmitExpense: "Catat & Simpan ke Drive",
    formSubmitTransfer: "Otorisasi & Cairkan Kas",
    formSubmitTask: "Buat & Tugaskan Kru",
    selectSourcePocket: "Kantong Asal (Dari)",
    selectDestPocket: "Kantong Tujuan (Ke)",
    taskTitle: "Judul Tugas",
    taskAssignee: "Penerima Tugas",
    taskPriority: "Tingkat Prioritas",
    priorityLow: "Rendah",
    priorityMedium: "Sedang",
    priorityHigh: "Tinggi",
    priorityUrgent: "Mendesak",

    // Landing Page
    landingHeroEyebrow: "Sistem Operasi Produksi & Manajemen Proyek",
    landingHeroHeadline: "Kelola Produksi di Atas Infrastruktur Google Anda.",
    landingHeroSub: "Nol biaya langganan database cloud. Sinkronisasi foto nota langsung ke Google Drive. Rekonsiliasi keuangan live ke Google Sheets. Dibuat dengan arsitektur super minimalis untuk kru film, agensi kreatif, dan tim proyek cepat.",
    landingLaunchBtn: "Buka Workspace Produksi",
    landingExploreBtn: "Eksplorasi Simulator Lapangan",
    landingAuditReport: "Lihat Laporan Audit Desain & Ergonomi",
  },
  es: {
    // Brand & System
    appName: "closebook.",
    appTagline: "Sistema Operativo de Producción y Proyectos",
    activeProduction: "PRODUCCIÓN ACTIVA",
    driveVaultSynced: "Drive Vault: Sincronizado",
    synced: "Sincronizado",
    logExpense: "Registrar Gasto",
    preferences: "Preferencias",
    currency: "Moneda",
    language: "Idioma",
    theme: "Tema",
    dayCount: "Día {day} de {total}",
    syncActive: "Sincronización Activa",
    settingsTitle: "Preferencias del Sistema y Pantalla",
    settingsSub: "Personaliza moneda, idioma de la interfaz y paleta de colores.",
    close: "Cerrar",
    savePreferences: "Guardar Preferencias",

    // Nav Tabs
    tabOverview: "Resumen Ejecutivo",
    tabLedger: "Libro de Caja Chica",
    tabPockets: "Flujo de Fondos",
    tabTasks: "Tareas de Departamentos",
    tabCallSheet: "Plan de Rodaje Digital",
    tabEquipment: "Alquiler de Equipos",
    tabAlerts: "Alertas Automáticas",
    tabSheet: "Espejo Google Sheets",

    // Executive Overview
    totalBudget: "Presupuesto Total de Producción",
    budgetCommitted: "100% comprometido",
    disbursedToDepts: "Desembolsado a Departamentos",
    burnRate: "tasa de consumo",
    fieldCashOnHand: "Efectivo en Campo UPM",
    cashSufficient: "Suficiente para el Día 4",
    activeAlerts: "Alertas Activas del Sistema",
    auditRequired: "Auditoría requerida",
    deptBudgetRealization: "Realización Presupuestaria",
    deptBudgetSub: "Seguimiento en tiempo real frente al límite del departamento",
    recentEntries: "Gastos Recientes",
    viewAllLedger: "Ver Todo el Libro",
    activeFlags: "Alertas de Producción Activas",
    resolve: "Resolver",
    resolved: "Resuelto",
    acknowledgeResolve: "Verificar y Resolver",

    // Ledger
    ledgerTitle: "Libro de Auditoría de Caja Chica",
    ledgerSub: "Espejado directo a Google Drive y Sheets sin intermediarios pagos",
    searchPlaceholder: "Buscar por proveedor, departamento, descripción o TX...",
    filterAll: "Todos",
    filterApproved: "Aprobados",
    filterPending: "Pendientes",
    filterMissing: "Sin Comprobante",
    colTx: "REF TX",
    colVendor: "PROVEEDOR / DESCRIPCIÓN",
    colDept: "DEPARTAMENTO",
    colPocket: "FONDO",
    colAmount: "MONTO",
    colReceipt: "COMPROBANTE",
    colStatus: "ESTADO",
    colActions: "ACCIONES",
    exportSheet: "Exportar a Sheets",

    // Pockets
    pocketsTitle: "Jerarquía de Fondos Multi-Bolsillo",
    pocketsSub: "Desembolso sin fugas desde la Bóveda Principal al Equipo de Campo",
    transferFunds: "Transferir Fondos",
    custodian: "Custodio",
    remainingBalance: "Saldo Restante",
    totalAllocated: "Total Asignado",

    // Tasks
    tasksTitle: "Tablero de Tareas",
    tasksSub: "Coordinación en tiempo real entre Cámara, Arte, Eléctricos y Unidad",
    newTask: "Nueva Tarea",
    todo: "Por Hacer",
    inProgress: "En Proceso",
    completed: "Completado",

    // Call Sheet
    callSheetTitle: "Plan de Rodaje Digital",
    callSheetSub: "Horarios diarios, desglose de escenas, llamado y contactos médicos",
    callTime: "Hora de Llamado",
    estimatedWrap: "Cierre Estimado",
    location: "Locación",
    weather: "Clima",
    emergencyContact: "Médico y Emergencias",
    directorNotes: "Notas de Dirección",

    // Modals
    modalExpenseTitle: "Registrar Gasto de Caja",
    modalTransferTitle: "Transferir Fondos",
    modalTaskTitle: "Crear Tarea",
    formDesc: "Descripción del Gasto",
    formAmount: "Monto",
    formDept: "Departamento",
    formPocket: "Fondo",
    formVendor: "Proveedor / Comercio",
    formAttachReceipt: "Adjuntar Foto del Comprobante",
    formMissingReceiptCheck: "Marcar comprobante como extraviado",
    formSubmitExpense: "Registrar y Enviar a Drive",
    formSubmitTransfer: "Autorizar y Desembolsar",
    formSubmitTask: "Crear y Asignar",
    selectSourcePocket: "Fondo Origen (Desde)",
    selectDestPocket: "Fondo Destino (Hacia)",
    taskTitle: "Título de la Tarea",
    taskAssignee: "Asignado a",
    taskPriority: "Prioridad",
    priorityLow: "Baja",
    priorityMedium: "Media",
    priorityHigh: "Alta",
    priorityUrgent: "Urgente",

    // Landing Page
    landingHeroEyebrow: "Sistema Operativo de Producción y Proyectos",
    landingHeroHeadline: "Gestiona tu Producción en Infraestructura Google.",
    landingHeroSub: "Cero costos de bases de datos en la nube. Sincronización directa de comprobantes a Google Drive. Reconciliación en vivo con Google Sheets.",
    landingLaunchBtn: "Abrir Workspace de Producción",
    landingExploreBtn: "Explorar Demostración",
    landingAuditReport: "Ver Informe de Auditoría",
  },
  ja: {
    // Brand & System
    appName: "closebook.",
    appTagline: "モダン制作＆プロジェクトOS",
    activeProduction: "進行中の制作",
    driveVaultSynced: "Drive保管庫: 同期済み",
    synced: "同期済み",
    logExpense: "経費を記録",
    preferences: "環境設定",
    currency: "通貨",
    language: "言語",
    theme: "テーマ",
    dayCount: "撮影日 {day} / {total}",
    syncActive: "同期アクティブ",
    settingsTitle: "表示・システム設定",
    settingsSub: "通貨、言語、インターフェーステーマを自由に切り替えられます。",
    close: "閉じる",
    savePreferences: "設定を保存",

    // Nav Tabs
    tabOverview: "総括ダッシュボード",
    tabLedger: "小口現金出納帳",
    tabPockets: "資金ポケット階層",
    tabTasks: "部門別タスク",
    tabCallSheet: "デジタルコールシート",
    tabEquipment: "機材・レンタル",
    tabAlerts: "自動アラート",
    tabSheet: "Googleスプレッドシート",

    // Executive Overview
    totalBudget: "総制作予算",
    budgetCommitted: "100% 割当済み",
    disbursedToDepts: "部門別出金総額",
    burnRate: "予算消化率",
    fieldCashOnHand: "現場手許現金 (UPM)",
    cashSufficient: "4日目充足",
    activeAlerts: "アクティブ警告",
    auditRequired: "監査が必要です",
    deptBudgetRealization: "部門別予算執行状況",
    deptBudgetSub: "部門予算上限に対するリアルタイム支出推移",
    recentEntries: "最近の小口現金支出",
    viewAllLedger: "出納帳をすべて表示",
    activeFlags: "プロダクション警告",
    resolve: "解決",
    resolved: "解決済み",
    acknowledgeResolve: "確認して解決",

    // Ledger
    ledgerTitle: "小口現金監査元帳",
    ledgerSub: "Google Drive及びスプレッドシートへの直接ミラーリング",
    searchPlaceholder: "取引先、部門、品目、TX番号で検索...",
    filterAll: "すべての項目",
    filterApproved: "承認済み",
    filterPending: "承認待ち",
    filterMissing: "領収書紛失",
    colTx: "TX参照",
    colVendor: "取引先 / 支出内容",
    colDept: "担当部門",
    colPocket: "資金ポケット",
    colAmount: "金額",
    colReceipt: "領収書写真",
    colStatus: "状態",
    colActions: "操作",
    exportSheet: "スプレッドシート出力",

    // Pockets
    pocketsTitle: "多階層キャッシュフロー",
    pocketsSub: "プロデューサー保管庫から現場クルーまでの漏れなき資金出金",
    transferFunds: "ポケット間送金",
    custodian: "管理者",
    remainingBalance: "残高",
    totalAllocated: "配分総額",

    // Tasks
    tasksTitle: "部門タスクボード",
    tasksSub: "撮影、美術、照明、制作部間のリアルタイム連携",
    newTask: "新規タスク作成",
    todo: "予定",
    inProgress: "進行中",
    completed: "完了",

    // Call Sheet
    callSheetTitle: "デジタルコールシート",
    callSheetSub: "本日の撮影予定、シーン割、集合時間、緊急連絡先",
    callTime: "集合時間 (Call)",
    estimatedWrap: "終了予定 (Wrap)",
    location: "撮影ロケ地",
    weather: "天候",
    emergencyContact: "医療・救護連絡先",
    directorNotes: "監督・プロデューサー指示",

    // Modals
    modalExpenseTitle: "小口現金を記録",
    modalTransferTitle: "資金ポケット間送金",
    modalTaskTitle: "部門タスクを作成",
    formDesc: "支出内容",
    formAmount: "金額",
    formDept: "部門",
    formPocket: "資金ポケット",
    formVendor: "取引先 / 店舗",
    formAttachReceipt: "領収書写真を添付",
    formMissingReceiptCheck: "領収書紛失フラグ（UPM承認が必要）",
    formSubmitExpense: "記録してDriveに同期",
    formSubmitTransfer: "承認して資金移動",
    formSubmitTask: "タスクを作成・割当",
    selectSourcePocket: "送金元ポケット",
    selectDestPocket: "送金先ポケット",
    taskTitle: "タスク名",
    taskAssignee: "担当者",
    taskPriority: "優先度",
    priorityLow: "低",
    priorityMedium: "中",
    priorityHigh: "高",
    priorityUrgent: "至急",

    // Landing Page
    landingHeroEyebrow: "制作・プロジェクト運営OS",
    landingHeroHeadline: "Googleインフラの上で制作を動かす。",
    landingHeroSub: "クラウドDB費用ゼロ。領収書はGoogle Driveへ直結同期。Google Sheetsとのリアルタイム連携。",
    landingLaunchBtn: "ワークスペースを起動",
    landingExploreBtn: "インタラクティブ体験",
    landingAuditReport: "監査レポートを確認",
  },
};

interface PreferencesContextType {
  currency: CurrencyCode;
  language: LanguageCode;
  theme: ThemeCode;
  setCurrency: (c: CurrencyCode) => void;
  setLanguage: (l: LanguageCode) => void;
  setTheme: (t: ThemeCode) => void;
  formatMoney: (amountInUSD: number) => string;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  currencies: Record<CurrencyCode, CurrencyConfig>;
  languages: Record<LanguageCode, LanguageConfig>;
  themes: Record<ThemeCode, ThemeConfig>;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [theme, setThemeState] = useState<ThemeCode>("obsidian");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem("closebook_currency") as CurrencyCode;
      if (savedCurrency && CURRENCIES[savedCurrency]) {
        setCurrencyState(savedCurrency);
      }

      const savedLang = localStorage.getItem("closebook_language") as LanguageCode;
      if (savedLang && LANGUAGES[savedLang]) {
        setLanguageState(savedLang);
      }

      const savedTheme = localStorage.getItem("closebook_theme") as ThemeCode;
      if (savedTheme && THEMES[savedTheme]) {
        setThemeState(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", "obsidian");
      }
    } catch {}
    setMounted(true);
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem("closebook_currency", c);
    } catch {}
  };

  const setLanguage = (l: LanguageCode) => {
    setLanguageState(l);
    try {
      localStorage.setItem("closebook_language", l);
    } catch {}
  };

  const setTheme = (th: ThemeCode) => {
    setThemeState(th);
    try {
      localStorage.setItem("closebook_theme", th);
    } catch {}
    document.documentElement.setAttribute("data-theme", th);
  };

  // Convert and format monetary amounts with international localization
  const formatMoney = (amountInUSD: number): string => {
    const config = CURRENCIES[currency] || CURRENCIES.USD;
    const converted = amountInUSD * config.rate;

    if (currency === "IDR") {
      // Indonesian Rupiah: no decimals, dot separator
      const rounded = Math.round(converted);
      return `Rp ${rounded.toLocaleString("id-ID")}`;
    }

    if (currency === "JPY") {
      const rounded = Math.round(converted);
      return `¥${rounded.toLocaleString("ja-JP")}`;
    }

    if (currency === "EUR") {
      return `€${converted.toLocaleString("de-DE", { minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals })}`;
    }

    if (currency === "GBP") {
      return `£${converted.toLocaleString("en-GB", { minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals })}`;
    }

    if (currency === "SGD") {
      return `S$${converted.toLocaleString("en-SG", { minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals })}`;
    }

    // Default USD
    return `$${converted.toLocaleString("en-US", { minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals })}`;
  };

  // Translation helper with dynamic token replacement
  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    let text = langDict[key] || TRANSLATIONS.en[key] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([token, val]) => {
        text = text.replace(new RegExp(`\\{${token}\\}`, "g"), String(val));
      });
    }

    return text;
  };

  return (
    <PreferencesContext.Provider
      value={{
        currency,
        language,
        theme,
        setCurrency,
        setLanguage,
        setTheme,
        formatMoney,
        t,
        isSettingsOpen,
        setIsSettingsOpen,
        currencies: CURRENCIES,
        languages: LANGUAGES,
        themes: THEMES,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
