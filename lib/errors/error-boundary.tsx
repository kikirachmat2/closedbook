"use client";

// =========================================================================
// CLOSEDBOOK PRODUCTION OS — 4-LAYER REACT ERROR BOUNDARY (ADR-006)
// =========================================================================

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logLocalError } from "@/lib/db/error-log";
import { AlertTriangle, RefreshCw, Download } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  subsystem?: "ai" | "queue" | "drive" | "sw" | "general";
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LayeredErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logLocalError({
      level: "error",
      message: error.message,
      stack: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
        subsystem: this.props.subsystem || "general",
      },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleDownloadBackup = () => {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        error: this.state.error?.message,
        localStorageSnapshot: { ...localStorage },
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `closedbook-emergency-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal membuat file cadangan.");
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-950/10 p-6 backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Terjadi Kendala pada Antarmuka
            </h3>
            <p className="mb-4 text-sm text-neutral-400">
              {this.state.error?.message || "Komponen tidak dapat dimuat. Data Anda tersimpan aman di perangkat lokal."}
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </button>
              <button
                onClick={this.handleDownloadBackup}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                <Download className="h-4 w-4" />
                Unduh Cadangan
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
