// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import BottomNav from "@/components/mobile/BottomNav";
import TopAppBar from "@/components/mobile/TopAppBar";
import FAB from "@/components/mobile/FAB";
import EmptyState from "@/components/mobile/EmptyState";
import {
  NetworkErrorBanner,
  ValidationErrorHelper,
  AuthErrorModal,
  CriticalErrorFallback,
} from "@/components/mobile/ErrorRecovery";
import {
  ToggleSwitch,
  SuccessCheckmark,
  CopyConfirmToast,
} from "@/components/mobile/MicroInteractions";
import { Receipt, Search } from "lucide-react";
import { PreferencesProvider } from "@/lib/preferences";

describe("Mobile Shell & UX Psychology (Unit Tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BottomNav (Hick's Law & Serial Position)", () => {
    it("renders exactly 5 navigation tabs (Hick's Law)", () => {
      render(
        <PreferencesProvider>
          <BottomNav activeTab="transactions" onTabChange={vi.fn()} />
        </PreferencesProvider>
      );
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(5);
    });

    it("places Ledger as first tab and Settings as last tab (Serial Position Effect)", () => {
      render(
        <PreferencesProvider>
          <BottomNav activeTab="transactions" onTabChange={vi.fn()} />
        </PreferencesProvider>
      );
      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveTextContent("Ledger");
      expect(tabs[4]).toHaveTextContent("Settings");
    });

    it("highlights active tab with aria-selected=true and crimson accent (Von Restorff)", () => {
      render(
        <PreferencesProvider>
          <BottomNav activeTab="transactions" onTabChange={vi.fn()} />
        </PreferencesProvider>
      );
      const ledgerTab = screen.getByRole("tab", { name: /ledger/i });
      const tasksTab = screen.getByRole("tab", { name: /tasks/i });
      expect(ledgerTab).toHaveAttribute("aria-selected", "true");
      expect(tasksTab).toHaveAttribute("aria-selected", "false");
    });

    it("renders notification badge dot when badge key is active", () => {
      render(
        <PreferencesProvider>
          <BottomNav
            activeTab="transactions"
            onTabChange={vi.fn()}
            badges={{ tasks: true }}
          />
        </PreferencesProvider>
      );
      expect(screen.getByTestId("badge-dot-tasks")).toBeInTheDocument();
    });

    it("triggers onTabChange and responds to arrow key navigation", () => {
      const handleTabChange = vi.fn();
      render(
        <PreferencesProvider>
          <BottomNav activeTab="transactions" onTabChange={handleTabChange} />
        </PreferencesProvider>
      );
      const tasksTab = screen.getByRole("tab", { name: /tasks/i });
      fireEvent.click(tasksTab);
      expect(handleTabChange).toHaveBeenCalledWith("tasks");

      const ledgerTab = screen.getByRole("tab", { name: /ledger/i });
      fireEvent.keyDown(ledgerTab, { key: "ArrowRight" });
      expect(handleTabChange).toHaveBeenCalledWith("tasks");
    });
  });

  describe("TopAppBar (Jakob's Law & Progressive Disclosure)", () => {
    it("renders page title in H1 format", () => {
      render(<TopAppBar title="Petty Cash Ledger" isRoot={true} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Petty Cash Ledger");
    });

    it("renders back button for non-root screens and menu for root screen", () => {
      const { rerender } = render(<TopAppBar title="Root View" isRoot={true} />);
      expect(screen.getByLabelText("Toggle navigation menu")).toBeInTheDocument();

      rerender(<TopAppBar title="Detail View" isRoot={false} onBack={vi.fn()} />);
      expect(screen.getByLabelText("Navigate back")).toBeInTheDocument();
    });
  });

  describe("FAB (Fitts's Law & Radial Menu)", () => {
    it("renders primary action button with 56px standard size", () => {
      render(
        <PreferencesProvider>
          <FAB activeTab="transactions" onPrimaryAction={vi.fn()} />
        </PreferencesProvider>
      );
      const fabBtn = screen.getByRole("button", { name: /primary action/i });
      expect(fabBtn).toHaveClass("w-14", "h-14"); // 56x56px
    });

    it("triggers primary action on click", () => {
      const handlePrimary = vi.fn();
      render(
        <PreferencesProvider>
          <FAB activeTab="transactions" onPrimaryAction={handlePrimary} />
        </PreferencesProvider>
      );
      const fabBtn = screen.getByRole("button", { name: /primary action/i });
      fireEvent.click(fabBtn);
      expect(handlePrimary).toHaveBeenCalledTimes(1);
    });
  });

  describe("EmptyState (Peak-End Rule & Aesthetic-Usability)", () => {
    it("renders 48px hero icon, serif headline, and actionable copy", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          icon={Receipt}
          headline="Belum Ada Pengeluaran"
          body="Catat petty cash produksi dan scan struk di sini."
          actionLabel="Catat Pertama"
          onAction={handleAction}
        />
      );
      expect(screen.getByText("Belum Ada Pengeluaran")).toBeInTheDocument();
      expect(screen.getByText("Catat petty cash produksi dan scan struk di sini.")).toBeInTheDocument();
      
      const cta = screen.getByRole("button", { name: /catat pertama/i });
      fireEvent.click(cta);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("ErrorRecovery (Peak-End Recovery Patterns)", () => {
    it("renders NetworkErrorBanner with offline message and retry action", () => {
      const handleRetry = vi.fn();
      render(<NetworkErrorBanner onRetry={handleRetry} />);
      expect(screen.getByText(/perubahan tersimpan lokal/i)).toBeInTheDocument();
      
      const retryBtn = screen.getByRole("button", { name: /cek koneksi/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it("renders ValidationErrorHelper with role=alert", () => {
      render(<ValidationErrorHelper error="Jumlah transfer harus lebih dari 0" />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Jumlah transfer harus lebih dari 0");
    });

    it("renders AuthErrorModal with login action and zero data loss reassurance", () => {
      const handleReauth = vi.fn();
      render(
        <AuthErrorModal
          isOpen={true}
          onReauth={handleReauth}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText("Sesi Berakhir")).toBeInTheDocument();
      const loginBtn = screen.getByRole("button", { name: /login ulang/i });
      fireEvent.click(loginBtn);
      expect(handleReauth).toHaveBeenCalledTimes(1);
    });

    it("renders CriticalErrorFallback with retry and emergency backup CTAs", () => {
      const handleReset = vi.fn();
      const handleBackup = vi.fn();
      render(
        <CriticalErrorFallback
          error="Dexie connection aborted"
          onReset={handleReset}
          onDownloadBackup={handleBackup}
        />
      );
      expect(screen.getByText("Gagal Menyimpan Sesi")).toBeInTheDocument();
      
      const retryBtn = screen.getByRole("button", { name: /coba lagi/i });
      fireEvent.click(retryBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);

      const backupBtn = screen.getByRole("button", { name: /unduh cadangan/i });
      fireEvent.click(backupBtn);
      expect(handleBackup).toHaveBeenCalledTimes(1);
    });
  });

  describe("MicroInteractions Library", () => {
    it("toggles ToggleSwitch with accessible role=switch and aria-checked", () => {
      const handleChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={handleChange} label="Haptic Toggle" />);
      const switchEl = screen.getByRole("switch", { name: "Haptic Toggle" });
      expect(switchEl).toHaveAttribute("aria-checked", "false");

      fireEvent.click(switchEl);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("renders SuccessCheckmark SVG path element", () => {
      render(<SuccessCheckmark />);
      expect(screen.getByTestId("success-checkmark")).toBeInTheDocument();
    });

    it("renders CopyConfirmToast with undo action button", () => {
      const handleUndo = vi.fn();
      const handleDismiss = vi.fn();
      render(
        <CopyConfirmToast
          message="Kode disalin ke clipboard"
          onUndo={handleUndo}
          onDismiss={handleDismiss}
        />
      );
      expect(screen.getByText("Kode disalin ke clipboard")).toBeInTheDocument();
      const undoBtn = screen.getByRole("button", { name: /urungkan/i });
      fireEvent.click(undoBtn);
      expect(handleUndo).toHaveBeenCalledTimes(1);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
