// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Button,
  Card,
  Input,
  Label,
  Badge,
  Divider,
  Skeleton,
  Sheet,
  Toast,
} from "@/components/ui";

describe("Component Primitives Library (Unit)", () => {
  describe("Button", () => {
    it("renders with default primary variant and touch target >= 44px class", () => {
      render(<Button>Simpan Data</Button>);
      const btn = screen.getByRole("button", { name: "Simpan Data" });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain("min-h-[44px]");
      expect(btn.className).toContain("bg-[var(--cb-crimson)]");
    });

    it("renders secondary and ghost variants", () => {
      const { rerender } = render(<Button variant="secondary">Batal</Button>);
      expect(screen.getByRole("button").className).toContain("bg-[var(--cb-surface)]");

      rerender(<Button variant="ghost">Lewati</Button>);
      expect(screen.getByRole("button").className).toContain("bg-transparent");
    });

    it("handles loading state and disables button", () => {
      render(<Button isLoading>Memproses</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
    });

    it("fires onClick handler when clicked", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Klik</Button>);
      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Card", () => {
    it("renders with surface background and 14px radius without shadow", () => {
      render(<Card data-testid="test-card">Konten Kartu</Card>);
      const card = screen.getByTestId("test-card");
      expect(card).toBeInTheDocument();
      expect(card.className).toContain("rounded-[var(--cb-radius-surface)]");
      expect(card.className).not.toContain("shadow-");
    });
  });

  describe("Input", () => {
    it("renders with 16px font and 44px min-height for touch compliance", () => {
      render(<Input placeholder="Masukkan nama proyek" />);
      const input = screen.getByPlaceholderText("Masukkan nama proyek");
      expect(input).toBeInTheDocument();
      expect(input.className).toContain("min-h-[44px]");
      expect(input.className).toContain("text-[16px]");
    });

    it("applies error border when isError is true", () => {
      render(<Input isError placeholder="Error input" />);
      const input = screen.getByPlaceholderText("Error input");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input.className).toContain("border-[var(--cb-error)]");
    });
  });

  describe("Label", () => {
    it("renders with htmlFor and shows required asterisk when isRequired is true", () => {
      render(
        <Label htmlFor="title" isRequired>
          Judul Skenario
        </Label>
      );
      const label = screen.getByText("Judul Skenario");
      expect(label).toHaveAttribute("for", "title");
      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  describe("Badge", () => {
    it("renders micro font pill badge with crimson variant", () => {
      render(<Badge variant="crimson">P0 Urgent</Badge>);
      const badge = screen.getByText("P0 Urgent");
      expect(badge.className).toContain("rounded-[var(--cb-radius-pill)]");
      expect(badge.className).toContain("text-[11px]");
    });
  });

  describe("Divider", () => {
    it("renders separator role with horizontal and vertical support", () => {
      const { rerender } = render(<Divider data-testid="div" />);
      expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");

      rerender(<Divider data-testid="div" orientation="vertical" />);
      expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
    });
  });

  describe("Skeleton", () => {
    it("renders loading pulse element with aria-hidden", () => {
      render(<Skeleton data-testid="skel" variant="pill" />);
      const skel = screen.getByTestId("skel");
      expect(skel).toHaveAttribute("aria-hidden", "true");
      expect(skel.className).toContain("animate-pulse");
    });
  });

  describe("Sheet", () => {
    it("renders dialog when isOpen is true and dismisses on close button click", () => {
      const handleClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={handleClose} title="Detail Anggaran">
          <p>Data anggaran</p>
        </Sheet>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Detail Anggaran")).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText("Tutup sheet"));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("renders nothing when isOpen is false", () => {
      render(
        <Sheet isOpen={false} onClose={() => {}} title="Hidden">
          <p>Hidden</p>
        </Sheet>
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Toast", () => {
    it("renders notification status with success variant and close button", () => {
      const handleClose = vi.fn();
      render(
        <Toast
          variant="success"
          message="Data Tersimpan"
          description="Tersinkron ke Drive"
          onClose={handleClose}
        />
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Data Tersimpan")).toBeInTheDocument();
      expect(screen.getByText("Tersinkron ke Drive")).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText("Tutup notifikasi"));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
