"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FileSpreadsheet,
  FileText,
  Clock,
  HardDrive,
  RefreshCw,
  Download,
  Eye,
  Sparkles,
} from "lucide-react";
import { getRecentDocuments, type DocumentGeneratedRecord } from "@/lib/documents/recent";
import { generateDocument, type GeneratedDocument } from "@/lib/documents";
import DocumentPreviewSheet from "@/components/mobile/DocumentPreviewSheet";

interface RecentDocumentsSectionProps {
  projectId: string;
}

export default function RecentDocumentsSection({ projectId }: RecentDocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentGeneratedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [recompilingId, setRecompilingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getRecentDocuments(projectId, 6);
      setDocuments(records);
    } catch (err) {
      console.warn("Failed to load recent documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDocuments();
    // Listen for storage changes or custom event
    const handleStorageUpdate = () => loadDocuments();
    window.addEventListener("focus", handleStorageUpdate);
    return () => window.removeEventListener("focus", handleStorageUpdate);
  }, [loadDocuments]);

  const handleOpenPreview = async (docRecord: DocumentGeneratedRecord) => {
    setRecompilingId(docRecord.id);
    try {
      let dataPayload: any = {
        projectName: "The Quiet Horizon",
        entries: [
          {
            date: "2026-09-26",
            description: "Sound Wireless Kit Rental Day 4",
            category: "Sound",
            amount: 1250,
          },
        ],
      };

      if (docRecord.type === "call-sheet") {
        dataPayload = {
          productionTitle: "The Quiet Horizon",
          shootDay: 4,
          totalDays: 16,
          date: "October 14, 2026",
          generalCrewCall: "06:00 AM",
          nearestHospital: "St. Jude Memorial Hospital (0.8 miles - Dial 911)",
          scenes: [
            {
              sceneNumber: "14A",
              dayNight: "DAY",
              pages: "2 1/8",
              description: "Int. Diner - Markus confronts Elena",
              cast: "1, 2",
              location: "Stage 3",
            },
          ],
          cast: [
            { character: "Markus Vance", actor: "Alex Cole", callTime: "06:30 AM" },
          ],
        };
      } else if (docRecord.type === "wrap-report") {
        dataPayload = {
          productionTitle: "The Quiet Horizon",
          dayNumber: 4,
          totalDays: 16,
          date: "October 14, 2026",
          departments: [
            { department: "Camera & Grip", budget: 35000, actualToday: 1800, actualToDate: 14200 },
          ],
        };
      }

      // Re-compile doc binary for preview/download
      const generated = await generateDocument(docRecord.type, {
        projectId: docRecord.projectId,
        data: dataPayload,
      });
      setPreviewDoc(generated);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Failed to re-generate document for preview:", err);
      alert("Gagal memuat pratinjau dokumen.");
    } finally {
      setRecompilingId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section className="surface-panel p-5 sm:p-6" data-testid="recent-documents-section">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-primary,#ff1e42)]/10 text-[var(--color-primary,#ff1e42)]">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#fdfdfd]">Dokumen Produksi Terbaru</h3>
            <p className="text-xs text-[#737373]">
              Berkas yang dikompilasi secara lokal (Zero-Retention)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadDocuments}
          className="btn-ghost-pill text-xs flex items-center gap-1.5 px-3 py-1.5 hover:text-white"
          title="Segarkan daftar"
          aria-label="Segarkan daftar dokumen"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Segarkan</span>
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="py-8 text-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.04] text-[#737373] mx-auto mb-2.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-[#a3a3a3]">Belum ada dokumen yang dibuat</p>
          <p className="text-[11px] text-[#737373] max-w-xs mx-auto mt-1">
            Gunakan tombol aksi FAB (+) di pojok kanan bawah lalu pilih &quot;Buat Dokumen&quot; untuk menghasilkan Buku Kas (.xlsx) atau Call Sheet (.docx).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => {
            const isExcel = doc.type === "ledger" || doc.type === "wrap-report";
            const Icon = isExcel ? FileSpreadsheet : FileText;
            const badgeColor = isExcel
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-blue-500/10 text-blue-400 border-blue-500/20";
            const extension = isExcel ? ".XLSX" : ".DOCX";

            return (
              <div
                key={doc.id}
                data-testid={`recent-doc-card-${doc.type}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-[#161616] hover:bg-[#1a1a1a] transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.04] shrink-0 group-hover:bg-white/[0.08] transition-colors">
                    <Icon className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">{doc.title}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                        {extension}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#737373] mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(doc.generatedAt)}
                      </span>
                      <span>•</span>
                      <span>{formatSize(doc.size)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPreview(doc)}
                  disabled={recompilingId === doc.id}
                  data-testid={`btn-preview-recent-${doc.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-medium transition-all shrink-0 active:scale-95 disabled:opacity-50"
                  aria-label={`Buka pratinjau ${doc.title}`}
                >
                  {recompilingId === doc.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--color-primary,#ff1e42)]" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Pratinjau</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Re-usable Document Preview Sheet */}
      <DocumentPreviewSheet
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={previewDoc}
      />
    </section>
  );
}
