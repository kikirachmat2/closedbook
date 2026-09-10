"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CurrencyCode = "USD" | "IDR" | "EUR" | "GBP" | "SGD" | "JPY";
export type LanguageCode = "en" | "id" | "es" | "ja";
export type ThemeCode = "signature" | "obsidian" | "indigo" | "emerald" | "amber" | "paper";

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
  signature: {
    code: "signature",
    name: "ClosedBook Signature",
    description: "Electric Titanium Crimson canvas with ultra-refined tactile borders",
    accentColor: "#FF2A4D",
    bgPreview: "#050505",
    panelPreview: "#111111",
  },
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
    appName: "closedbook.",
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
    tabTasks: "Team Tasks",
    tabCallSheet: "Project Schedule",
    tabEquipment: "Equipment Rental",
    tabAlerts: "Automated Alerts",
    tabSheet: "Google Sheet Mirror",

    // Executive Overview
    totalBudget: "Total Project Budget",
    budgetCommitted: "100% committed",
    disbursedToDepts: "Disbursed to Categories",
    burnRate: "burn rate",
    fieldCashOnHand: "Field Cash on Hand",
    cashSufficient: "Sufficient for Project Day",
    activeAlerts: "Active Automated Alerts",
    auditRequired: "Audit required",
    deptBudgetRealization: "Category Budget Realization",
    deptBudgetSub: "Real-time spend tracking against category ceiling",
    recentEntries: "Recent Cash Entries",
    viewAllLedger: "View All Ledger",
    activeFlags: "Active Project Flags",
    resolve: "Resolve",
    resolved: "Resolved",
    acknowledgeResolve: "Acknowledge & Resolve",

    // Ledger
    ledgerTitle: "Petty Cash Audit Ledger",
    ledgerSub: "BYOS Google Drive mirrored ledger with live photo attachments",
    searchPlaceholder: "Search by vendor, category, description, or TX...",
    filterAll: "All Entries",
    filterApproved: "Approved",
    filterPending: "Pending Approval",
    filterMissing: "Missing Receipt",
    colTx: "TX REF",
    colVendor: "VENDOR / DESCRIPTION",
    colDept: "CATEGORY",
    colPocket: "POCKET",
    colAmount: "AMOUNT",
    colReceipt: "RECEIPT",
    colStatus: "STATUS",
    colActions: "ACTIONS",
    exportSheet: "Export to Sheets",

    // Pockets
    pocketsTitle: "Multi-Pocket Cashflow Hierarchy",
    pocketsSub: "Zero-leakage disbursement from Master Vault to Field Leads",
    transferFunds: "Transfer Funds",
    custodian: "Custodian",
    remainingBalance: "Remaining Balance",
    totalAllocated: "Total Allocated",

    // Tasks
    tasksTitle: "Team Tasks & Action Board",
    tasksSub: "Cross-functional task delivery tracking with priority badges",
    createTask: "Create Task",
    newTask: "Create Task",
    allDepts: "All Categories",
    statusTodo: "To Do",
    statusInProgress: "In Progress",
    statusCompleted: "Completed",

    // Call Sheet -> Schedule
    callSheetTitle: "Project Schedule & Daily Briefing",
    callSheetSub: "Live schedule, location coordinates, logistics, and emergency contacts",
    callTime: "Call Time / Start",
    estimatedWrap: "Estimated Close-out",
    location: "Location",
    scenesScheduled: "Key Agenda / Milestones",
    directorNotes: "Lead / Coordinator Notes",
    weatherForecast: "Weather Forecast",
    emergencyContact: "Emergency Contact",

    // Modals
    modalExpenseTitle: "Log Petty Cash Expense",
    modalTransferTitle: "Transfer Pocket Funds",
    modalTaskTitle: "Create Team Task",
    formDesc: "Expense Description",
    formAmount: "Amount",
    formDept: "Category",
    formPocket: "Pocket",
    formVendor: "Vendor / Merchant",
    formAttachReceipt: "Attach Receipt Photo",
    formMissingReceiptCheck: "Flag receipt as missing (Lead approval required)",
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
    landingHeroHeadline: "Run Projects on Google Infrastructure.",
    landingHeroSub: "Zero cloud database bills. Direct Google Drive receipt sync. Real-time Google Sheets reconciliation. Designed with extreme architectural minimalism for project teams, creative agencies, and fast-moving operations.",
    landingLaunchBtn: "Launch Project Workspace",
    landingExploreBtn: "Explore Interactive Demo",
    landingAuditReport: "View System & Design Audit Report",

    // Upgraded Features
    exportCSV: "Export to CSV",
    downloadVault: "Download Project Vault (JSON)",
    advanceDay: "Advance Project Day",
    editCallSheet: "Edit Schedule Brief",
    addEquipment: "Add Rental Gear",
    totalEquipmentBurn: "Daily Equipment Burn",
    transferHistory: "Transfer Audit Log",
    receiptPreview: "Receipt Inspector",
    dropOrCaptureReceipt: "Upload or capture receipt photo (<300KB auto-compressed)",
    overdraftAlert: "Overdraft prevented: Transfer exceeds source liquid balance",
    statusOnSet: "Active / On Site",
    statusRented: "Rented",
    statusReturned: "Returned",
    statusDamaged: "Damaged",
    markReturned: "Mark Returned",
    markDamaged: "Mark Damaged",
    deleteItem: "Delete",
    webhookUrl: "Google Apps Script Webhook URL",
    webhookSyncToggle: "Auto-Sync New Transactions",
    saveWebhook: "Save Webhook Endpoint",
    testWebhook: "Test Ping Webhook",
    syncAllToSheets: "Push All Transactions to Google Sheets",
    copyAppsScript: "Copy Google Apps Script Template",
    appsScriptCopied: "Apps Script Code Copied to Clipboard!",
    offlineStatus: "Offline Mode (Local Vault Active)",
    onlineStatus: "Online & Vault Synced",
    printWrapReport: "Print Project Close-out Summary",
    addCategory: "Add Category",
    editCategory: "Edit Category",
    deleteCategory: "Delete Category",
    categoryName: "Category Name",
    categoryCode: "Category Code",
    categoryBudget: "Allocated Budget",
    categoryColor: "Color Accent",
    saveCategory: "Save Category",
    confirmDeleteCategory: "Are you sure you want to delete this category?",
    commentThreadTitle: "Thread",
    commentsCount: "Comments",
    addCommentPlaceholder: "Write a contextual update or note...",
    sendComment: "Send",
    noCommentsYet: "No comments recorded yet for this item.",
    postingAs: "Posting as",
  },
  id: {
    // Brand & System
    appName: "closedbook.",
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
    tabTasks: "Tugas Tim & Aksi",
    tabCallSheet: "Jadwal & Agenda Proyek",
    tabEquipment: "Inventaris & Rental",
    tabAlerts: "Peringatan Otomatis",
    tabSheet: "Cermin Google Sheets",

    // Executive Overview
    totalBudget: "Total Anggaran Proyek",
    budgetCommitted: "100% teralokasi",
    disbursedToDepts: "Teralokasi ke Kategori",
    burnRate: "tingkat penyerapan",
    fieldCashOnHand: "Kas Tunai Lapangan",
    cashSufficient: "Mencukupi untuk Hari Proyek",
    activeAlerts: "Peringatan Sistem Aktif",
    auditRequired: "Perlu audit segera",
    deptBudgetRealization: "Realisasi Anggaran Kategori",
    deptBudgetSub: "Pemantauan pengeluaran langsung terhadap pagu anggaran tiap kategori",
    recentEntries: "Pengeluaran Kas Terbaru",
    viewAllLedger: "Lihat Semua Buku Kas",
    activeFlags: "Peringatan Proyek Aktif",
    resolve: "Selesaikan",
    resolved: "Terselesaikan",
    acknowledgeResolve: "Verifikasi & Selesaikan",

    // Ledger
    ledgerTitle: "Buku Kas Lapangan & Audit Nota",
    ledgerSub: "Buku besar mirrored langsung ke Google Drive & Sheets milik tim tanpa perantara cloud berbayar",
    searchPlaceholder: "Cari berdasarkan toko, kategori, uraian, atau nomor TX...",
    filterAll: "Semua Transaksi",
    filterApproved: "Disetujui",
    filterPending: "Menunggu Persetujuan",
    filterMissing: "Nota Hilang",
    colTx: "KODE TX",
    colVendor: "TOKO / URAIAN BELANJA",
    colDept: "KATEGORI",
    colPocket: "KANTONG",
    colAmount: "NOMINAL",
    colReceipt: "FOTO BUKTI NOTA",
    colStatus: "STATUS",
    colActions: "AKSI",
    exportSheet: "Ekspor ke Google Sheets",

    // Pockets
    pocketsTitle: "Hierarki Aliran Dana Multi-Kantong",
    pocketsSub: "Cegah kebocoran dana dengan pencairan bertingkat dari Brankas Utama ke Tim Lapangan",
    transferFunds: "Transfer Dana Kantong",
    custodian: "Penanggung Jawab",
    remainingBalance: "Sisa Saldo Kas",
    totalAllocated: "Total Plafon",

    // Tasks
    tasksTitle: "Papan Kerja & Tindakan Tim",
    tasksSub: "Koordinasi real-time lintas divisi dan penanggung jawab operasional",
    newTask: "Buat Tugas Baru",
    todo: "Rencana",
    inProgress: "Sedang Dikerjakan",
    completed: "Selesai",

    // Call Sheet -> Schedule
    callSheetTitle: "Jadwal Proyek & Briefing Harian",
    callSheetSub: "Jadwal aktivitas harian, rincian agenda/milestone, cuaca, dan kontak darurat",
    callTime: "Waktu Mulai / Call Time",
    estimatedWrap: "Estimasi Selesai (Close-out)",
    location: "Lokasi Kerja / Proyek",
    weather: "Kondisi Cuaca",
    emergencyContact: "Medis & Kontak Darurat",
    directorNotes: "Catatan Koordinator / Tim Leader",

    // Modals
    modalExpenseTitle: "Catat Pengeluaran Kas Lapangan",
    modalTransferTitle: "Transfer Dana Antar-Kantong",
    modalTaskTitle: "Buat Tugas Kerja Tim",
    formDesc: "Uraian Pengeluaran",
    formAmount: "Nominal",
    formDept: "Kategori",
    formPocket: "Kantong Kas",
    formVendor: "Nama Toko / Vendor",
    formAttachReceipt: "Lampirkan Foto Nota",
    formMissingReceiptCheck: "Tandai nota fisik hilang (perlu persetujuan Tim Leader)",
    formSubmitExpense: "Catat & Simpan ke Drive",
    formSubmitTransfer: "Otorisasi & Cairkan Kas",
    formSubmitTask: "Buat & Tugaskan Anggota Tim",
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
    landingHeroEyebrow: "Sistem Operasi Proyek & Manajemen Operasional",
    landingHeroHeadline: "Kelola Proyek di Atas Infrastruktur Google Anda.",
    landingHeroSub: "Nol biaya langganan database cloud. Sinkronisasi foto nota langsung ke Google Drive. Rekonsiliasi keuangan live ke Google Sheets. Dibuat dengan arsitektur super minimalis untuk tim proyek, agensi kreatif, dan operasi cepat.",
    landingLaunchBtn: "Buka Workspace Proyek",
    landingExploreBtn: "Eksplorasi Simulator Lapangan",
    landingAuditReport: "Lihat Laporan Audit Desain & Ergonomi",

    // Upgraded Features
    exportCSV: "Ekspor ke CSV",
    downloadVault: "Unduh Cadangan Vault (JSON)",
    advanceDay: "Maju ke Hari Proyek Berikutnya",
    editCallSheet: "Edit Jadwal Briefing",
    addEquipment: "Tambah Inventaris Rental",
    totalEquipmentBurn: "Pengeluaran Harian Alat",
    transferHistory: "Riwayat Transfer Dana",
    receiptPreview: "Inspeksi Nota",
    dropOrCaptureReceipt: "Unggah atau potret nota (kompresi otomatis <300KB)",
    overdraftAlert: "Overdraft dicegah: Transfer melebihi saldo kas tersedia",
    statusOnSet: "Aktif / Di Lokasi",
    statusRented: "Disewa",
    statusReturned: "Dikembalikan",
    statusDamaged: "Rusak",
    markReturned: "Tandai Kembali",
    markDamaged: "Tandai Rusak",
    deleteItem: "Hapus",
    webhookUrl: "URL Webhook Google Apps Script",
    webhookSyncToggle: "Sinkronisasi Otomatis Transaksi",
    saveWebhook: "Simpan Endpoint Webhook",
    testWebhook: "Uji Koneksi Webhook",
    syncAllToSheets: "Kirim Semua Transaksi ke Google Sheets",
    copyAppsScript: "Salin Kode Template Apps Script",
    appsScriptCopied: "Kode Apps Script Berhasil Disalin!",
    offlineStatus: "Mode Offline (Vault Lokal Aktif)",
    onlineStatus: "Online & Vault Terhubung",
    printWrapReport: "Cetak Ringkasan Close-out Proyek",
    addCategory: "Tambah Kategori",
    editCategory: "Edit Kategori",
    deleteCategory: "Hapus Kategori",
    categoryName: "Nama Kategori",
    categoryCode: "Kode Kategori",
    categoryBudget: "Alokasi Anggaran",
    categoryColor: "Aksen Warna",
    saveCategory: "Simpan Kategori",
    confirmDeleteCategory: "Yakin ingin menghapus kategori ini?",
    commentThreadTitle: "Thread Komentar",
    commentsCount: "Komentar",
    addCommentPlaceholder: "Tulis pembaruan atau catatan kontekstual...",
    sendComment: "Kirim",
    noCommentsYet: "Belum ada komentar yang dicatat untuk item ini.",
    postingAs: "Kirim sebagai",
  },
  es: {
    // Brand & System
    appName: "closedbook.",
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
    tabTasks: "Tareas del Equipo",
    tabCallSheet: "Cronograma del Proyecto",
    tabEquipment: "Alquiler de Equipos",
    tabAlerts: "Alertas Automáticas",
    tabSheet: "Espejo Google Sheets",

    // Executive Overview
    totalBudget: "Presupuesto Total del Proyecto",
    budgetCommitted: "100% comprometido",
    disbursedToDepts: "Desembolsado a Categorías",
    burnRate: "tasa de consumo",
    fieldCashOnHand: "Efectivo en Campo",
    cashSufficient: "Suficiente para el Día de Proyecto",
    activeAlerts: "Alertas Activas del Sistema",
    auditRequired: "Auditoría requerida",
    deptBudgetRealization: "Realización por Categorías",
    deptBudgetSub: "Seguimiento en tiempo real frente al límite de cada categoría",
    recentEntries: "Gastos Recientes",
    viewAllLedger: "Ver Todo el Libro",
    activeFlags: "Alertas de Proyecto Activas",
    resolve: "Resolver",
    resolved: "Resuelto",
    acknowledgeResolve: "Verificar y Resolver",

    // Ledger
    ledgerTitle: "Libro de Auditoría de Caja Chica",
    ledgerSub: "Espejado directo a Google Drive y Sheets sin intermediarios pagos",
    searchPlaceholder: "Buscar por proveedor, categoría, descripción o TX...",
    filterAll: "Todos",
    filterApproved: "Aprobados",
    filterPending: "Pendientes",
    filterMissing: "Sin Comprobante",
    colTx: "REF TX",
    colVendor: "PROVEEDOR / DESCRIPCIÓN",
    colDept: "CATEGORÍA",
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
    tasksTitle: "Tablero de Tareas del Equipo",
    tasksSub: "Coordinación en tiempo real entre áreas y responsables",
    newTask: "Nueva Tarea",
    todo: "Por Hacer",
    inProgress: "En Proceso",
    completed: "Completado",

    // Call Sheet -> Schedule
    callSheetTitle: "Cronograma de Proyecto y Agenda Diaria",
    callSheetSub: "Horarios diarios, hitos previstos, ubicación y contactos de emergencia",
    callTime: "Hora de Inicio / Llamado",
    estimatedWrap: "Cierre Estimado (Close-out)",
    location: "Ubicación / Proyecto",
    weather: "Clima",
    emergencyContact: "Médico y Emergencias",
    directorNotes: "Notas de Coordinación / Líder",

    // Modals
    modalExpenseTitle: "Registrar Gasto de Caja",
    modalTransferTitle: "Transferir Fondos",
    modalTaskTitle: "Crear Tarea del Equipo",
    formDesc: "Descripción del Gasto",
    formAmount: "Monto",
    formDept: "Categoría",
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
    landingHeroEyebrow: "Sistema Operativo de Proyectos y Operaciones",
    landingHeroHeadline: "Gestiona Proyectos en Infraestructura Google.",
    landingHeroSub: "Cero costos de bases de datos en la nube. Sincronización directa de comprobantes a Google Drive. Reconciliación en vivo con Google Sheets.",
    landingLaunchBtn: "Abrir Workspace del Proyecto",
    landingExploreBtn: "Explorar Demostración",
    landingAuditReport: "Ver Informe de Auditoría",

    // Upgraded Features
    exportCSV: "Exportar a CSV",
    downloadVault: "Descargar Copia de Seguridad (JSON)",
    advanceDay: "Avanzar Día del Proyecto",
    editCallSheet: "Editar Cronograma",
    addEquipment: "Añadir Equipo de Alquiler",
    totalEquipmentBurn: "Gasto Diario de Equipo",
    transferHistory: "Registro de Transferencias",
    receiptPreview: "Inspección de Recibo",
    dropOrCaptureReceipt: "Subir o capturar foto del recibo (<300KB comprimido)",
    overdraftAlert: "Sobregiro evitado: La transferencia supera el saldo disponible",
    statusOnSet: "Activo / En Sitio",
    statusRented: "Alquilado",
    statusReturned: "Devuelto",
    statusDamaged: "Dañado",
    markReturned: "Marcar Devuelto",
    markDamaged: "Marcar Dañado",
    deleteItem: "Eliminar",
    webhookUrl: "URL de Webhook de Google Apps Script",
    webhookSyncToggle: "Sincronización automática de transacciones",
    saveWebhook: "Guardar endpoint de Webhook",
    testWebhook: "Probar ping de Webhook",
    syncAllToSheets: "Enviar todas las transacciones a Google Sheets",
    copyAppsScript: "Copiar plantilla de Google Apps Script",
    appsScriptCopied: "¡Código de Apps Script copiado al portapapeles!",
    offlineStatus: "Modo fuera de línea (Bóveda local activa)",
    onlineStatus: "En línea y sincronizado",
    printWrapReport: "Imprimir Resumen de Cierre de Proyecto",
    addCategory: "Agregar Categoría",
    editCategory: "Editar Categoría",
    deleteCategory: "Eliminar Categoría",
    categoryName: "Nombre de Categoría",
    categoryCode: "Código de Categoría",
    categoryBudget: "Presupuesto Asignado",
    categoryColor: "Color de Acento",
    saveCategory: "Guardar Categoría",
    confirmDeleteCategory: "¿Seguro que desea eliminar esta categoría?",
    commentThreadTitle: "Hilo de Discusión",
    commentsCount: "Comentarios",
    addCommentPlaceholder: "Escribe una actualización o nota contextual...",
    sendComment: "Enviar",
    noCommentsYet: "Aún no hay comentarios registrados para este elemento.",
    postingAs: "Publicando como",
  },
  ja: {
    // Brand & System
    appName: "closedbook.",
    appTagline: "モダン制作＆プロジェクトOS",
    activeProduction: "進行中の制作",
    driveVaultSynced: "Drive保管庫: 同期済み",
    synced: "同期済み",
    logExpense: "経費を記録",
    preferences: "環境設定",
    currency: "通貨",
    language: "言語",
    theme: "テーマ",
    dayCount: "{total}日中 {day}日目",
    syncActive: "同期中",
    settingsTitle: "表示・システム設定",
    settingsSub: "通貨、言語、インターフェースカラーテーマを設定できます。",
    close: "閉じる",
    savePreferences: "設定を保存",

    // Nav Tabs
    tabOverview: "全体概要",
    tabLedger: "小口現金出納帳",
    tabPockets: "多階層資金ポケット",
    tabTasks: "チームタスク",
    tabCallSheet: "スケジュール",
    tabEquipment: "機材レンタル",
    tabAlerts: "自動アラート",
    tabSheet: "Googleスプレッドシート連携",

    // Executive Overview
    totalBudget: "プロジェクト総予算",
    budgetCommitted: "100% 配分済み",
    disbursedToDepts: "カテゴリー配分額",
    burnRate: "消費ペース",
    fieldCashOnHand: "現場手元現金",
    cashSufficient: "本日のプロジェクト十分",
    activeAlerts: "未解決アラート",
    auditRequired: "監査要確認",
    deptBudgetRealization: "カテゴリー別予算消化状況",
    deptBudgetSub: "カテゴリー上限に対するリアルタイム支出",
    recentEntries: "最近の現金支出",
    viewAllLedger: "出納帳をすべて見る",
    activeFlags: "重要フラグ",
    resolve: "解決済みにする",
    resolved: "解決済み",
    acknowledgeResolve: "確認して解決済みにする",

    // Ledger
    ledgerTitle: "現場小口現金出納帳",
    ledgerSub: "Google Drive保管庫と画像連携したリアルタイム出納帳",
    searchPlaceholder: "取引先、カテゴリー、内容、TX番号で検索...",
    filterAll: "すべての項目",
    filterApproved: "承認済み",
    filterPending: "承認待ち",
    filterMissing: "領収書未添付",
    colTx: "TX番号",
    colVendor: "取引先 / 支出内容",
    colDept: "カテゴリー",
    colPocket: "ポケット",
    colAmount: "金額",
    colReceipt: "領収書",
    colStatus: "ステータス",
    colActions: "操作",
    exportSheet: "スプレッドシートへ出力",

    // Pockets
    pocketsTitle: "多階層資金管理",
    pocketsSub: "マスター保管庫から現場担当者への資金配分",
    transferFunds: "資金移動",
    custodian: "管理者",
    remainingBalance: "残高",
    totalAllocated: "配分総額",

    // Tasks
    tasksTitle: "チームタスク＆アクションボード",
    tasksSub: "優先度バッジ付きの部署横断タスク進行管理",
    createTask: "タスク作成",
    newTask: "新規タスク作成",
    allDepts: "すべてのカテゴリー",
    statusTodo: "未着手",
    statusInProgress: "進行中",
    statusCompleted: "完了",

    // Call Sheet -> Schedule
    callSheetTitle: "プロジェクトスケジュール＆日次ブリーフィング",
    callSheetSub: "リアルタイム進行表、ロケ地情報、物流、緊急連絡先",
    callTime: "開始時間",
    estimatedWrap: "予定終了時間",
    location: "場所",
    scenesScheduled: "主要アジェンダ / マイルストーン",
    directorNotes: "リーダー / 統括指示",
    weatherForecast: "天気予報",
    emergencyContact: "緊急連絡先",

    // Modals
    modalExpenseTitle: "小口現金支出を記録",
    modalTransferTitle: "ポケット資金を移動",
    modalTaskTitle: "チームタスク作成",
    formDesc: "支出内容",
    formAmount: "金額",
    formDept: "カテゴリー",
    formPocket: "支払元ポケット",
    formVendor: "取引先 / 店舗",
    formAttachReceipt: "領収書写真を添付",
    formMissingReceiptCheck: "領収書紛失として申請 (統括承認必須)",
    formSubmitExpense: "記録してDriveへ反映",
    formSubmitTransfer: "承認して資金移動",
    formSubmitTask: "タスクを作成して割り当て",
    selectSourcePocket: "移動元ポケット",
    selectDestPocket: "移動先ポケット",
    taskTitle: "タスク名",
    taskAssignee: "担当者",
    taskPriority: "優先度",
    priorityLow: "低",
    priorityMedium: "中",
    priorityHigh: "高",
    priorityUrgent: "緊急",

    // Landing Page
    landingHeroEyebrow: "制作・プロジェクトオペレーティングシステム",
    landingHeroHeadline: "Googleインフラで動く、究極の現場OS。",
    landingHeroSub: "クラウドDB費用ゼロ。領収書はGoogle Driveへ即座に自動同期。Googleスプレッドシートでのリアルタイム照合。無駄を極限まで削ぎ落とした、プロフェッショナル現場のためのシステム。",
    landingLaunchBtn: "ワークスペースを開く",
    landingExploreBtn: "インタラクティブデモを見る",
    landingAuditReport: "システム監査レポートを見る",

    // Upgraded Features
    exportCSV: "CSV形式で出力",
    downloadVault: "プロジェクト保管庫 (JSON) をダウンロード",
    advanceDay: "プロジェクト進行日を翌日へ進める",
    editCallSheet: "スケジュールブリーフを編集",
    addEquipment: "レンタル機材を追加",
    totalEquipmentBurn: "日次機材コスト",
    transferHistory: "資金移動履歴",
    receiptPreview: "領収書プレビュー",
    dropOrCaptureReceipt: "領収書写真をアップロードまたは撮影 (<300KB 自動圧縮)",
    overdraftAlert: "残高不足: 移動元ポケットの残高を超えています",
    statusOnSet: "現場稼働中",
    statusRented: "レンタル中",
    statusReturned: "返却済み",
    statusDamaged: "故障",
    markReturned: "返却完了にする",
    markDamaged: "故障報告にする",
    deleteItem: "削除",
    webhookUrl: "Google Apps Script Webhook URL",
    webhookSyncToggle: "新規取引の自動同期",
    saveWebhook: "Webhook設定を保存",
    testWebhook: "Webhook接続テスト",
    syncAllToSheets: "すべての取引をGoogleスプレッドシートへ送信",
    copyAppsScript: "Apps Scriptテンプレートをコピー",
    appsScriptCopied: "Apps Scriptコードをコピーしました！",
    offlineStatus: "オフラインモード (ローカル保管庫稼働中)",
    onlineStatus: "オンライン＆同期完了",
    printWrapReport: "プロジェクト完了サマリーを印刷",
    addCategory: "カテゴリー追加",
    editCategory: "カテゴリー編集",
    deleteCategory: "カテゴリー削除",
    categoryName: "カテゴリー名",
    categoryCode: "カテゴリーコード",
    categoryBudget: "予算割当",
    categoryColor: "アクセントカラー",
    saveCategory: "カテゴリー保存",
    confirmDeleteCategory: "このカテゴリーを削除してもよろしいですか？",
    commentThreadTitle: "スレッド",
    commentsCount: "件のコメント",
    addCommentPlaceholder: "状況やコンテキストのメモを入力...",
    sendComment: "送信",
    noCommentsYet: "このアイテムにはまだコメントがありません。",
    postingAs: "投稿者",
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
  const [theme, setThemeState] = useState<ThemeCode>("signature");
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
        document.documentElement.setAttribute("data-theme", "signature");
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
