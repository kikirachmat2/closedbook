"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  TrendingDown,
  TrendingUp,
  PenLine,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { Pocket, DailyReconcile } from "@/lib/types";

interface ReconciliationTabProps {
  pockets: Pocket[];
  reconciliations: DailyReconcile[];
  currentDay: number;
  currentDate: string;
  formatMoney: (amount: number) => string;
  onReconcile: (physicalCounts: Record<string, number>, reconciledBy: string) => DailyReconcile;
  onSignOff: (recId: string, signedOffBy: string) => void;
}

export default function ReconciliationTab({
  pockets,
  reconciliations,
  currentDay,
  currentDate,
  formatMoney,
  onReconcile,
  onSignOff,
}: ReconciliationTabProps) {
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reconciledBy, setReconciledBy] = useState("Devon Reed (UPM)");
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({});
  const [signOffModal, setSignOffModal] = useState<DailyReconcile | null>(null);
  const [signedOffBy, setSignedOffBy] = useState("Elena Rostova (LP)");
  const [justSubmitted, setJustSubmitted] = useState<DailyReconcile | null>(null);

  const fieldPockets = pockets.filter((p) => p.type !== "master_vault");

  const todayReconciled = reconciliations.find((r) => r.dayNumber === currentDay);
  const hasReconciled = !!todayReconciled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const counts: Record<string, number> = {};
    fieldPockets.forEach((p) => {
      counts[p.id] = parseFloat(physicalCounts[p.id] || String(p.balance));
    });
    const result = onReconcile(counts, reconciledBy);
    setJustSubmitted(result);
    setIsFormOpen(false);
    setPhysicalCounts({});
  };

  const statusConfig = {
    open: { label: "Open", color: "#6366f1", Icon: ClipboardCheck },
    balanced: { label: "Balanced ✓", color: "#10b981", Icon: CheckCircle2 },
    discrepancy: { label: "Discrepancy!", color: "#ff1e42", Icon: AlertTriangle },
    signed_off: { label: "Signed Off", color: "#10b981", Icon: ShieldCheck },
  };

  return (
    <div className="space-y-6">
      {/* ── Header + CTA ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-[#fdfdfd]">Daily Cash Reconciliation</h2>
          <p className="text-xs text-[#737373] mt-0.5">
            End-of-day physical cash count vs system balance audit
          </p>
        </div>
        {!hasReconciled && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary,#ff1e42)] text-white text-xs font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
          >
            <PenLine className="w-4 h-4" />
            Reconcile Day {currentDay}
          </button>
        )}
        {hasReconciled && todayReconciled?.status !== "signed_off" && (
          <button
            onClick={() => setSignOffModal(todayReconciled!)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 text-xs font-semibold hover:bg-[#10b981]/30 transition-all min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4" />
            Sign Off Day {currentDay}
          </button>
        )}
      </div>

      {/* ── Just-submitted result banner ── */}
      {justSubmitted && (
        <div
          className={`rounded-xl border p-4 ${
            justSubmitted.totalDiscrepancy === 0
              ? "bg-[#0a1a0f] border-[#10b981]/30"
              : "bg-[#1a0a0a] border-[#ff1e42]/30"
          }`}
        >
          <div className="flex items-center gap-3">
            {justSubmitted.totalDiscrepancy === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#ff1e42] shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-[#fdfdfd]">
                {justSubmitted.totalDiscrepancy === 0
                  ? `Day ${justSubmitted.dayNumber} Reconciled — Cash Balanced`
                  : `Day ${justSubmitted.dayNumber} — Discrepancy of ${formatMoney(Math.abs(justSubmitted.totalDiscrepancy))} found`}
              </p>
              <p className="text-xs text-[#737373] mt-0.5">
                {justSubmitted.totalDiscrepancy === 0
                  ? "All field cash counts match system balances. Awaiting LP sign-off."
                  : `Physical count ${justSubmitted.totalDiscrepancy > 0 ? "OVER" : "SHORT"} by ${formatMoney(Math.abs(justSubmitted.totalDiscrepancy))}. Immediate review required.`}
              </p>
            </div>
            <button
              className="ml-auto text-[#737373] hover:text-[#fdfdfd] text-xs"
              onClick={() => setJustSubmitted(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Reconciliation Form ── */}
      {isFormOpen && (
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#fdfdfd] mb-4">
            Day {currentDay} Cash Count — {currentDate}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-[#737373] uppercase tracking-wider mb-1.5">
                Reconciled By
              </label>
              <input
                type="text"
                value={reconciledBy}
                onChange={(e) => setReconciledBy(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]/50"
                placeholder="Name & Role"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] text-[#737373] uppercase tracking-wider">
                Physical Cash Count per Pocket
              </label>
              {fieldPockets.map((pocket) => (
                <div
                  key={pocket.id}
                  className="bg-[#121212] border border-white/[0.06] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium text-[#fdfdfd]">{pocket.name}</p>
                      <p className="text-[11px] text-[#737373]">{pocket.custodian}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#737373]">System balance</p>
                      <p className="text-xs font-mono font-semibold text-[#fdfdfd]">
                        {formatMoney(pocket.balance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-[#737373] shrink-0">Physical count ($):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={pocket.balance.toFixed(2)}
                      value={physicalCounts[pocket.id] || ""}
                      onChange={(e) =>
                        setPhysicalCounts((prev) => ({ ...prev, [pocket.id]: e.target.value }))
                      }
                      className="flex-1 bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]/50 font-mono"
                    />
                    {physicalCounts[pocket.id] && (
                      <span
                        className={`text-xs font-mono font-semibold shrink-0 ${
                          parseFloat(physicalCounts[pocket.id]) > pocket.balance
                            ? "text-[#10b981]"
                            : parseFloat(physicalCounts[pocket.id]) < pocket.balance
                            ? "text-[#ff1e42]"
                            : "text-[#737373]"
                        }`}
                      >
                        {parseFloat(physicalCounts[pocket.id]) > pocket.balance
                          ? `+${formatMoney(parseFloat(physicalCounts[pocket.id]) - pocket.balance)}`
                          : parseFloat(physicalCounts[pocket.id]) < pocket.balance
                          ? `-${formatMoney(pocket.balance - parseFloat(physicalCounts[pocket.id]))}`
                          : "✓ Balanced"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[var(--color-primary,#ff1e42)] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Submit Reconciliation
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-3 bg-[#121212] border border-white/[0.08] text-[#737373] text-sm rounded-xl hover:text-[#fdfdfd] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Sign-off Modal ── */}
      {signOffModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-semibold text-[#fdfdfd] mb-2">
              Line Producer Sign-Off — Day {signOffModal.dayNumber}
            </h3>
            <p className="text-xs text-[#737373] mb-4">
              By signing off, you confirm that the cash count is verified and approved.
            </p>
            <div
              className={`rounded-xl border p-3 mb-4 ${
                signOffModal.totalDiscrepancy === 0
                  ? "bg-[#0a1a0f] border-[#10b981]/30"
                  : "bg-[#1a0a0a] border-[#ff1e42]/30"
              }`}
            >
              <p className="text-xs font-mono text-[#fdfdfd]">
                System Total: {formatMoney(signOffModal.totalSystemBalance)} |{" "}
                Physical Total: {formatMoney(signOffModal.totalPhysicalCount)} |{" "}
                <span
                  className={signOffModal.totalDiscrepancy === 0 ? "text-[#10b981]" : "text-[#ff1e42]"}
                >
                  Δ {signOffModal.totalDiscrepancy >= 0 ? "+" : ""}
                  {formatMoney(signOffModal.totalDiscrepancy)}
                </span>
              </p>
            </div>
            <input
              type="text"
              value={signedOffBy}
              onChange={(e) => setSignedOffBy(e.target.value)}
              className="w-full bg-[#121212] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-[#fdfdfd] focus:outline-none focus:border-[#10b981]/50 mb-4"
              placeholder="LP Name (authorizing)"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onSignOff(signOffModal.id, signedOffBy);
                  setSignOffModal(null);
                }}
                className="flex-1 bg-[#10b981] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                <ShieldCheck className="w-4 h-4 inline mr-2" />
                Sign Off & Lock
              </button>
              <button
                onClick={() => setSignOffModal(null)}
                className="px-4 py-3 bg-[#121212] border border-white/[0.08] text-[#737373] text-sm rounded-xl hover:text-[#fdfdfd] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reconciliation History ── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-3">
          Reconciliation History
        </h3>
        <div className="space-y-3">
          {reconciliations.length === 0 && (
            <div className="text-center py-12 text-[#737373] text-sm">
              No reconciliations recorded yet.
            </div>
          )}
          {reconciliations.map((rec) => {
            const cfg = statusConfig[rec.status];
            const isExpanded = expandedRecId === rec.id;
            return (
              <div
                key={rec.id}
                className="bg-[#0d0d0d] border border-white/[0.06] rounded-xl overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedRecId(isExpanded ? null : rec.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <cfg.Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                    <div>
                      <p className="text-xs font-semibold text-[#fdfdfd]">
                        Day {rec.dayNumber} — {rec.date}
                      </p>
                      <p className="text-[11px] text-[#737373]">By: {rec.reconciledBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${cfg.color}20`,
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                      {rec.totalDiscrepancy !== 0 && (
                        <p
                          className={`text-[11px] font-mono mt-1 ${
                            rec.totalDiscrepancy > 0 ? "text-[#10b981]" : "text-[#ff1e42]"
                          }`}
                        >
                          {rec.totalDiscrepancy > 0 ? "+" : ""}
                          {formatMoney(rec.totalDiscrepancy)}
                        </p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#737373]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#737373]" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] p-4 space-y-2">
                    {rec.entries.map((entry) => (
                      <div
                        key={entry.pocketId}
                        className="flex items-center justify-between gap-4 text-xs py-2 border-b border-white/[0.04] last:border-0"
                      >
                        <div>
                          <p className="font-medium text-[#fdfdfd]">{entry.pocketName}</p>
                          <p className="text-[#737373]">{entry.custodian}</p>
                        </div>
                        <div className="flex items-center gap-4 text-right text-[11px] font-mono">
                          <div>
                            <p className="text-[#737373]">System</p>
                            <p className="text-[#fdfdfd]">{formatMoney(entry.systemBalance)}</p>
                          </div>
                          <div>
                            <p className="text-[#737373]">Physical</p>
                            <p className="text-[#fdfdfd]">{formatMoney(entry.physicalCount)}</p>
                          </div>
                          <div>
                            <p className="text-[#737373]">Δ</p>
                            <p
                              className={
                                entry.discrepancy === 0
                                  ? "text-[#10b981]"
                                  : entry.discrepancy > 0
                                  ? "text-[#10b981]"
                                  : "text-[#ff1e42]"
                              }
                            >
                              {entry.discrepancy === 0 ? (
                                "✓"
                              ) : (
                                <>
                                  {entry.discrepancy > 0 ? (
                                    <TrendingUp className="w-3 h-3 inline mr-0.5" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 inline mr-0.5" />
                                  )}
                                  {entry.discrepancy > 0 ? "+" : ""}
                                  {formatMoney(entry.discrepancy)}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Sign-off info */}
                    {rec.status === "signed_off" && (
                      <div className="mt-3 bg-[#0a1a0f] rounded-lg px-3 py-2 flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                        <p className="text-[11px] text-[#10b981]">
                          Signed off by <strong>{rec.signedOffBy}</strong> at {rec.signedOffAt}
                        </p>
                      </div>
                    )}

                    {/* Summary row */}
                    <div className="mt-3 bg-[#121212] rounded-lg p-3 flex justify-between text-xs font-mono">
                      <span className="text-[#737373]">
                        Total System: <span className="text-[#fdfdfd]">{formatMoney(rec.totalSystemBalance)}</span>
                      </span>
                      <span className="text-[#737373]">
                        Physical: <span className="text-[#fdfdfd]">{formatMoney(rec.totalPhysicalCount)}</span>
                      </span>
                      <span
                        className={rec.totalDiscrepancy === 0 ? "text-[#10b981]" : "text-[#ff1e42]"}
                      >
                        Net Δ:{" "}
                        {rec.totalDiscrepancy >= 0 ? "+" : ""}
                        {formatMoney(rec.totalDiscrepancy)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
