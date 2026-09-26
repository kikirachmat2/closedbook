"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Receipt,
  CheckSquare,
  ArrowLeftRight,
  FileSpreadsheet,
  Plus,
  Camera,
  Download,
  AlertTriangle,
  Calendar,
  Printer,
  X,
  FileText,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { m, AnimatePresence } from "@/components/MotionProvider";
import { useHaptic } from "@/lib/hooks/use-haptic";
import { usePreferences } from "@/lib/preferences";
import BottomSheet from "./BottomSheet";
import dynamic from "next/dynamic";
import type {
  DocumentTemplateType,
  GeneratedDocument,
  DocumentGenerationProgress,
} from "@/lib/documents/types";

const DocumentPreviewSheet = dynamic(() => import("./DocumentPreviewSheet"), {
  ssr: false,
});

export interface RadialAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

interface FABProps {
  activeTab: string;
  onPrimaryAction: () => void;
  customActions?: RadialAction[];
  onScanReceipt?: () => void;
  onAddTask?: () => void;
  onTransfer?: () => void;
  onExportCsv?: () => void;
  onEditSchedule?: () => void;
  onPrintWrap?: () => void;
  onGenerateDocument?: () => void;
  onOpenAiAssistant?: () => void;
}

const TEMPLATE_OPTIONS: Array<{
  id: DocumentTemplateType;
  title: string;
  description: string;
  format: string;
  badgeColor: string;
  icon: React.ElementType;
}> = [
  {
    id: "ledger",
    title: "Buku Kas Produksi",
    description: "Buku kas kas kecil multi-kategori dengan baris header terkunci dan rumus SUM otomatis.",
    format: ".XLSX",
    badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: FileSpreadsheet,
  },
  {
    id: "call-sheet",
    title: "Call Sheet Harian",
    description: "Jadwal panggilan, adegan, kontak kru, dan panduan rumah sakit darurat.",
    format: ".DOCX",
    badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    icon: FileText,
  },
  {
    id: "wrap-report",
    title: "Laporan Wrap Harian",
    description: "Realisasi anggaran per departemen vs pagu disetujui serta analisis variansi.",
    format: ".XLSX",
    badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    icon: FileSpreadsheet,
  },
];

/**
 * FAB — Context-Aware Floating Action Button with Radial Menu (Fitts's Law + Hick's Law).
 * - Size: 56×56px (Material standard)
 * - Ergonomics: bottom-right (default) or bottom-left (configurable in Settings for left-handed users)
 * - Safe Area: 56px bottom nav + safe-area-inset-bottom + 16px margin
 * - Radial Menu: Includes "Generate Document" option opening Template Selector & DocumentPreviewSheet
 */
export default function FAB({
  activeTab,
  onPrimaryAction,
  customActions,
  onScanReceipt,
  onAddTask,
  onTransfer,
  onExportCsv,
  onEditSchedule,
  onPrintWrap,
  onGenerateDocument,
  onOpenAiAssistant,
}: FABProps) {
  const { triggerHaptic } = useHaptic();
  const { fabPosition } = usePreferences();
  const shouldReduceMotion = useReducedMotion();
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState<DocumentGenerationProgress | null>(null);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Document generators are loaded on-demand when user opens export / document sheet

  // Close radial menu on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRadialOpen) {
        setIsRadialOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRadialOpen]);

  const handleOpenTemplateSelector = () => {
    triggerHaptic("medium");
    setIsRadialOpen(false);
    if (onGenerateDocument) {
      onGenerateDocument();
    } else {
      setIsTemplateSelectorOpen(true);
    }
  };

  const handleSelectTemplate = async (templateType: DocumentTemplateType) => {
    triggerHaptic("heavy");
    setIsGenerating(true);
    setGeneratingType(templateType);

    try {
      let docInput: any = {
        projectId: "proj-quiet-horizon",
      };

      if (templateType === "ledger") {
        docInput.data = {
          projectName: "The Quiet Horizon (Feature Film)",
          entries: [
            {
              date: "2026-09-26",
              description: "Sound Wireless Kit Rental Day 4",
              category: "Sound",
              paymentMethod: "Field Cash",
              amount: 1250.0,
              notes: "Lectrosonics 4-ch package",
            },
            {
              date: "2026-09-26",
              description: "Crew Catering Lunch (45 pax)",
              category: "Catering",
              paymentMethod: "Petty Cash",
              amount: 945.5,
              notes: "Main unit box lunches",
            },
            {
              date: "2026-09-26",
              description: "Unit Van Fuel Refill",
              category: "Transport",
              paymentMethod: "Fuel Card",
              amount: 320.0,
              notes: "Vans #1 & #2",
            },
            {
              date: "2026-09-26",
              description: "Emergency G&E Clamps & Tape",
              category: "Camera/Grip",
              paymentMethod: "Cash",
              amount: 180.0,
              notes: "Hardware receipt #8812",
            },
          ],
        };
      } else if (templateType === "call-sheet") {
        docInput.data = {
          productionTitle: "The Quiet Horizon",
          shootDay: 4,
          totalDays: 16,
          date: "October 14, 2026",
          generalCrewCall: "06:00 AM",
          nearestHospital: "St. Jude Memorial Hospital (0.8 miles - Dial 911)",
          weatherForecast: "Partly Cloudy, 19°C (Low) / 24°C (High)",
          scenes: [
            {
              sceneNumber: "14A",
              dayNight: "DAY",
              pages: "2 1/8",
              description: "Int. Diner - Markus confronts Elena with ledger evidence",
              cast: "1, 2",
              location: "Stage 3 - Diner Set",
            },
            {
              sceneNumber: "15",
              dayNight: "DAY",
              pages: "1 4/8",
              description: "Ext. Alleyway - Markus escapes via fire stairs",
              cast: "1",
              location: "Backlot South Alley",
            },
          ],
          cast: [
            {
              character: "Markus Vance",
              actor: "Alex Cole",
              callTime: "06:30 AM",
              notes: "Tactical Wardrobe Set A",
            },
            {
              character: "Elena Rostova",
              actor: "Sofia Rossi",
              callTime: "07:00 AM",
              notes: "Office Suit Set B",
            },
          ],
        };
      } else if (templateType === "wrap-report") {
        docInput.data = {
          productionTitle: "The Quiet Horizon",
          dayNumber: 4,
          totalDays: 16,
          date: "October 14, 2026",
          producer: "Elena Rostova",
          director: "Alex Mercer",
          departments: [
            { department: "Camera & Grip", budget: 35000, actualToday: 1800, actualToDate: 14200 },
            { department: "Sound & Audio", budget: 18000, actualToday: 850, actualToDate: 6400 },
            { department: "Art & Wardrobe", budget: 24000, actualToday: 1200, actualToDate: 11500 },
            { department: "Production Office", budget: 15000, actualToday: 450, actualToDate: 4200 },
            { department: "Catering & Craft", budget: 20000, actualToday: 920, actualToDate: 7800 },
          ],
        };
      }

      setGenProgress({
        stage: "downloading",
        percent: 25,
        message: "Memuat modul penyusun...",
      });

      const { generateDocumentWithProgress } = await import("@/lib/documents");
      const { saveRecentDocument } = await import("@/lib/documents/recent");

      const doc = await generateDocumentWithProgress(templateType, docInput, {
        onProgress: (p) => setGenProgress(p),
        timeoutMs: 25000,
      });
      setGeneratedDoc(doc);

      // Track recently generated document in Dexie (T3.4)
      try {
        await saveRecentDocument({
          id: doc.filename,
          projectId: docInput.projectId || "proj-quiet-horizon",
          type: templateType,
          title: doc.metadata.title,
          filename: doc.filename,
          mimeType: doc.mimeType,
          size: doc.metadata.estimatedSizeBytes,
          generatedAt: doc.metadata.lastUpdated,
        });
      } catch (saveErr) {
        console.warn("Failed to persist generated document to Dexie:", saveErr);
      }

      setIsTemplateSelectorOpen(false);
      setIsDocumentPreviewOpen(true);
    } catch (err: any) {
      console.error("Failed to generate document:", err);
      alert(err?.message || "Gagal membuat dokumen. Silakan periksa kembali koneksi atau data proyek Anda.");
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
      setGenProgress(null);
    }
  };

  // Context-aware icon & default actions (Max 3 actions per Hick's Law)
  let ContextIcon = Plus;
  let defaultActions: RadialAction[] = [];

  switch (activeTab) {
    case "transactions":
      ContextIcon = Receipt;
      defaultActions = [
        {
          id: "generate-doc",
          label: "Buat Dokumen",
          icon: FileSpreadsheet,
          onClick: handleOpenTemplateSelector,
        },
        {
          id: "scan-receipt",
          label: "Pindai Struk",
          icon: Camera,
          onClick: () => onScanReceipt?.(),
        },
        {
          id: "add-expense",
          label: "Tambah Biaya",
          icon: Receipt,
          onClick: () => onPrimaryAction(),
        },
      ];
      break;

    case "tasks":
      ContextIcon = CheckSquare;
      defaultActions = [
        {
          id: "generate-doc",
          label: "Buat Dokumen",
          icon: FileSpreadsheet,
          onClick: handleOpenTemplateSelector,
        },
        {
          id: "add-task-urgent",
          label: "Tugas Mendesak",
          icon: AlertTriangle,
          onClick: () => onAddTask?.(),
        },
        {
          id: "add-task",
          label: "Tugas Baru",
          icon: CheckSquare,
          onClick: () => onPrimaryAction(),
        },
      ];
      break;

    case "pockets":
      ContextIcon = ArrowLeftRight;
      defaultActions = [
        {
          id: "generate-doc",
          label: "Buat Dokumen",
          icon: FileSpreadsheet,
          onClick: handleOpenTemplateSelector,
        },
        {
          id: "transfer-funds",
          label: "Transfer Kas",
          icon: ArrowLeftRight,
          onClick: () => onPrimaryAction(),
        },
        {
          id: "log-cash",
          label: "Catat Kas",
          icon: Receipt,
          onClick: () => onTransfer?.(),
        },
      ];
      break;

    case "callsheet":
      ContextIcon = FileSpreadsheet;
      defaultActions = [
        {
          id: "generate-doc",
          label: "Buat Dokumen",
          icon: FileSpreadsheet,
          onClick: handleOpenTemplateSelector,
        },
        {
          id: "edit-schedule",
          label: "Ubah Jadwal",
          icon: Calendar,
          onClick: () => onEditSchedule?.(),
        },
        {
          id: "print-summary",
          label: "Cetak Ringkasan",
          icon: Printer,
          onClick: () => onPrintWrap?.(),
        },
      ];
      break;

    default:
      ContextIcon = Plus;
      defaultActions = [
        {
          id: "ai-assistant",
          label: "AI Assistant",
          icon: Sparkles,
          onClick: () => {
            if (onOpenAiAssistant) onOpenAiAssistant();
          },
        },
        {
          id: "generate-doc",
          label: "Buat Dokumen",
          icon: FileSpreadsheet,
          onClick: handleOpenTemplateSelector,
        },
        {
          id: "quick-expense",
          label: "Catat Biaya",
          icon: Receipt,
          onClick: () => onPrimaryAction(),
        },
      ];
      break;
  }

  // Enforce Hick's Law: Strictly max 3 actions
  const radialActions = (customActions || defaultActions).slice(0, 3);

  const startLongPress = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      triggerHaptic("medium");
      setIsRadialOpen(true);
    }, 450);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = () => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    triggerHaptic("medium");
    if (isRadialOpen) {
      setIsRadialOpen(false);
    } else {
      onPrimaryAction();
    }
  };

  const positionClass =
    fabPosition === "left"
      ? "left-4 md:left-6"
      : "right-4 md:right-6";

  return (
    <>
      <div
        data-testid="fab-container"
        data-position={fabPosition}
        className={`md:hidden fixed ${positionClass} z-40`}
        style={{
          bottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        {/* Radial Menu Backdrop */}
        <AnimatePresence>
          {isRadialOpen && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRadialOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 cursor-pointer"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Radial Actions Stack (Hick's Law max 3) */}
        <AnimatePresence>
          {isRadialOpen && (
            <div
              id="fab-radial-menu"
              role="menu"
              aria-label="Quick Actions Menu"
              className="absolute bottom-16 right-0 flex flex-col items-end gap-2.5 mb-2 z-40"
            >
              {radialActions.map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <m.div
                    key={action.id}
                    role="menuitem"
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.15,
                      delay: idx * 0.04,
                    }}
                    className="flex items-center gap-2.5"
                  >
                    <span className="text-[11px] font-medium text-[var(--color-paper,#fdfdfd)] bg-[#121212]/90 border border-white/[0.1] px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap">
                      {action.label}
                    </span>
                    <button
                      type="button"
                      id={`radial-action-${action.id}`}
                      data-testid={`radial-action-${action.id}`}
                      onClick={() => {
                        triggerHaptic("medium");
                        setIsRadialOpen(false);
                        action.onClick();
                      }}
                      className="w-11 h-11 rounded-full bg-[#181818] border border-white/[0.15] text-[var(--color-paper,#fdfdfd)] hover:text-[var(--color-primary,#ff1e42)] hover:border-[var(--color-primary,#ff1e42)]/40 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                      aria-label={action.label}
                    >
                      <ActionIcon className="w-5 h-5" />
                    </button>
                  </m.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Primary 56×56px FAB Button */}
        <m.button
          id="context-fab-btn"
          data-testid="context-fab-btn"
          type="button"
          onMouseDown={startLongPress}
          onMouseUp={endLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={endLongPress}
          onClick={handleClick}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
          whileTap={{ scale: 0.94 }}
          className="w-14 h-14 rounded-full bg-[var(--color-primary,#ff1e42)] text-white flex items-center justify-center shadow-[0_6px_24px_rgba(255,30,66,0.45)] hover:shadow-[0_8px_30px_rgba(255,30,66,0.6)] hover:brightness-105 active:scale-95 transition-shadow select-none relative z-40"
          aria-label={isRadialOpen ? "Close Quick Actions" : "Primary Action"}
          aria-haspopup="menu"
          aria-expanded={isRadialOpen}
        >
          {isRadialOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <ContextIcon className="w-6 h-6 stroke-[2.2]" />
          )}
        </m.button>
      </div>

      {/* Template Selector Sheet */}
      <BottomSheet
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        title="Buat Dokumen Produksi"
        initialSnap="half"
      >
        <div className="flex flex-col gap-3 pb-6 text-[var(--cb-text-primary,#111827)]" data-testid="template-selector-sheet">
          <p className="text-xs text-[var(--cb-text-secondary,#4B5563)]">
            Pilih templat produksi terverifikasi untuk dikompilasi langsung di perangkat Anda (Zero-Retention).
          </p>

          {/* Progress Indicator untuk Mobile 3G / Toleransi Unduhan NN/g */}
          {isGenerating && genProgress && (
            <div
              role="status"
              aria-live="polite"
              data-testid="document-generation-progress"
              className="p-3.5 rounded-xl border border-[var(--color-primary,#ff1e42)]/30 bg-[var(--color-primary,#ff1e42)]/[0.06] flex flex-col gap-2 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--color-primary,#ff1e42)] flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {genProgress.message}
                </span>
                <span className="font-mono text-[11px] text-[var(--cb-text-secondary,#4B5563)]">
                  {genProgress.percent}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary,#ff1e42)] transition-all duration-300 rounded-full"
                  style={{ width: `${genProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {TEMPLATE_OPTIONS.map((tmpl) => {
              const Icon = tmpl.icon;
              const isItemGenerating = isGenerating && generatingType === tmpl.id;

              return (
                <button
                  key={tmpl.id}
                  type="button"
                  data-testid={`select-template-${tmpl.id}`}
                  disabled={isGenerating}
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className="flex items-center gap-3.5 p-3.5 rounded-[var(--cb-radius-surface,14px)] border border-[var(--cb-border,#E5E7EB)] bg-[var(--cb-surface,#FFFFFF)] hover:bg-[var(--cb-surface-elevated,#F9FAFB)] text-left transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--cb-surface-elevated,#F3F4F6)] shrink-0">
                    {isItemGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary,#ff1e42)]" />
                    ) : (
                      <Icon className="w-5 h-5 text-[var(--cb-text-primary,#111827)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm truncate">{tmpl.title}</h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tmpl.badgeColor}`}>
                        {tmpl.format}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--cb-text-secondary,#4B5563)] line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--cb-text-tertiary,#9CA3AF)] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* Document Preview Sheet (Lazy Loaded On Demand) */}
      {isDocumentPreviewOpen && generatedDoc && (
        <DocumentPreviewSheet
          isOpen={isDocumentPreviewOpen}
          onClose={() => setIsDocumentPreviewOpen(false)}
          document={generatedDoc}
        />
      )}
    </>
  );
}
