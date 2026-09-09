"use client";

import React from "react";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Zap, BarChart3, Clock } from "lucide-react";
import { Department } from "@/lib/types";

interface BurnForecast {
  totalSpent: number;
  dailyBurnRate: number;
  projectedTotal: number;
  projectedOverBudget: boolean;
  daysUntilBudgetExhausted: number | null;
  daysElapsed: number;
  daysRemaining: number;
  budgetUtilizationPct: number;
}

interface OverviewTabProps {
  project: { name: string; totalBudget: number; currency: string };
  departments: Department[];
  totalSpent: number;
  totalAllocated: number;
  activeAlertsCount: number;
  totalDailyEquipmentBurn: number;
  forecast: BurnForecast;
  formatMoney: (amount: number) => string;
  callSheet: { dayNumber: number; totalDays: number };
}

export default function OverviewTab({
  project,
  departments,
  totalSpent,
  totalAllocated,
  activeAlertsCount,
  totalDailyEquipmentBurn,
  forecast,
  formatMoney,
  callSheet,
}: OverviewTabProps) {
  const burnPct = Math.min(100, forecast.budgetUtilizationPct);

  return (
    <div className="space-y-6">
      {/* ── Burn Rate Forecast Banner ── */}
      <div
        className={`rounded-2xl border p-5 ${
          forecast.projectedOverBudget
            ? "bg-[#1a0a0a] border-[#ff1e42]/30"
            : "bg-[#0a1a0f] border-[#10b981]/20"
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {forecast.projectedOverBudget ? (
                <AlertTriangle className="w-4 h-4 text-[#ff1e42]" />
              ) : (
                <TrendingUp className="w-4 h-4 text-[#10b981]" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">
                Burn Rate Forecast
              </span>
            </div>
            <p className="text-xl font-bold text-[#fdfdfd] mt-1">
              {formatMoney(forecast.dailyBurnRate)}{" "}
              <span className="text-sm font-normal text-[#737373]">/ day avg</span>
            </p>
            <p
              className={`text-xs mt-1 ${
                forecast.projectedOverBudget ? "text-[#ff1e42]" : "text-[#10b981]"
              }`}
            >
              {forecast.projectedOverBudget
                ? `⚠ Projected overrun: ${formatMoney(forecast.projectedTotal - project.totalBudget)} over budget`
                : `✓ On-track — projected end: ${formatMoney(forecast.projectedTotal)}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#737373] mb-1">Days remaining</p>
            <p className="text-2xl font-bold text-[#fdfdfd]">{forecast.daysRemaining}</p>
            {forecast.daysUntilBudgetExhausted !== null && (
              <p className="text-[11px] text-[#f59e0b] mt-1">
                Budget exhausted in ~{forecast.daysUntilBudgetExhausted}d at current rate
              </p>
            )}
          </div>
        </div>

        {/* Visual burn bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-[#737373] mb-1.5">
            <span>{burnPct.toFixed(1)}% consumed</span>
            <span>
              {formatMoney(totalSpent)} / {formatMoney(project.totalBudget)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                burnPct > 90
                  ? "bg-[#ff1e42]"
                  : burnPct > 70
                  ? "bg-[#f59e0b]"
                  : "bg-[#10b981]"
              }`}
              style={{ width: `${burnPct}%` }}
            />
          </div>
          {/* Day progress */}
          <div className="mt-2">
            <div className="flex justify-between text-[11px] text-[#737373] mb-1">
              <span>
                Day {callSheet.dayNumber} of {callSheet.totalDays}
              </span>
              <span>{((callSheet.dayNumber / callSheet.totalDays) * 100).toFixed(0)}% through schedule</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full bg-[#6366f1]"
                style={{ width: `${(callSheet.dayNumber / callSheet.totalDays) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Budget"
          value={formatMoney(project.totalBudget)}
          sub="Production ceiling"
          icon={<DollarSign className="w-4 h-4" />}
          color="#6366f1"
        />
        <KPICard
          label="Total Spent"
          value={formatMoney(totalSpent)}
          sub={`${burnPct.toFixed(1)}% utilized`}
          icon={<TrendingDown className="w-4 h-4" />}
          color={burnPct > 80 ? "#ff1e42" : "#f59e0b"}
        />
        <KPICard
          label="Equipment Burn"
          value={formatMoney(totalDailyEquipmentBurn)}
          sub="Daily rental cost"
          icon={<Zap className="w-4 h-4" />}
          color="#06b6d4"
        />
        <KPICard
          label="Active Alerts"
          value={activeAlertsCount.toString()}
          sub="Unresolved issues"
          icon={<AlertTriangle className="w-4 h-4" />}
          color={activeAlertsCount > 0 ? "#ff1e42" : "#10b981"}
        />
      </div>

      {/* ── Department Breakdown ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-[#a3a3a3]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
            Department Budget Breakdown
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {departments.map((dept) => {
            const pct = Math.min(100, (dept.spentAmount / dept.allocatedBudget) * 100);
            const remaining = dept.allocatedBudget - dept.spentAmount;
            return (
              <div key={dept.id} className="bg-[#0d0d0d] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="text-xs font-medium text-[#fdfdfd] truncate">{dept.name}</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-semibold ${
                      pct > 90 ? "text-[#ff1e42]" : pct > 75 ? "text-[#f59e0b]" : "text-[#10b981]"
                    }`}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: dept.color }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#737373]">
                  <span>
                    Spent:{" "}
                    <span className="text-[#fdfdfd] font-medium">
                      {formatMoney(dept.spentAmount)}
                    </span>
                  </span>
                  <span>
                    Left:{" "}
                    <span className={`font-medium ${remaining < 0 ? "text-[#ff1e42]" : "text-[#a3a3a3]"}`}>
                      {formatMoney(Math.abs(remaining))}
                      {remaining < 0 ? " OVER" : ""}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Shoot Day Progress ── */}
      <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#a3a3a3]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
            Schedule Progress
          </span>
        </div>
        <div className="flex items-center gap-3">
          {Array.from({ length: callSheet.totalDays }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-6 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                i < callSheet.dayNumber
                  ? "bg-[var(--color-primary,#ff1e42)] text-white"
                  : i === callSheet.dayNumber
                  ? "bg-[#ff1e42]/20 border border-[#ff1e42]/40 text-[#ff1e42] animate-pulse"
                  : "bg-white/[0.04] text-[#404040]"
              }`}
              title={`Day ${i + 1}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-[#737373] font-medium">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-lg font-bold text-[#fdfdfd] leading-tight">{value}</p>
      <p className="text-[11px] text-[#737373]">{sub}</p>
    </div>
  );
}
