// @vitest-environment jsdom
// CLOSEDBOOK PRODUCTION OS — DOCUMENT PREVIEW SHEET UNIT TESTS
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentPreviewSheet from '../../components/mobile/DocumentPreviewSheet';
import type { GeneratedDocument } from '../../lib/documents/types';

// Mock parseDocumentPreview
vi.mock('@/lib/documents', () => ({
  parseDocumentPreview: vi.fn().mockResolvedValue([
    ['Date', 'Description', 'Category', 'Amount'],
    ['2026-09-26', 'Lunch Catering', 'Catering', '$945.50'],
    ['2026-09-26', 'G&E Tape', 'Camera', '$180.00'],
  ]),
}));

// Mock useHaptic
vi.mock('@/lib/hooks/use-haptic', () => ({
  useHaptic: () => ({
    triggerHaptic: vi.fn(),
  }),
}));

describe('DocumentPreviewSheet Component (T2.3)', () => {
  const mockDoc: GeneratedDocument = {
    filename: 'Master_Ledger_Test.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: new Uint8Array([80, 75, 3, 4, 0, 0, 0, 0]),
    metadata: {
      templateType: 'ledger',
      title: 'Master Production Ledger',
      filename: 'Master_Ledger_Test.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      estimatedSizeBytes: 24576, // 24.0 KB
      lastUpdated: '2026-09-26T01:00:00.000Z',
      templateVersion: '1.0.0',
    },
  };

  it('renders metadata correctly (title, filename, size)', async () => {
    render(
      <DocumentPreviewSheet
        isOpen={true}
        onClose={vi.fn()}
        document={mockDoc}
      />
    );

    expect(screen.getByTestId('doc-preview-title')).toHaveTextContent('Master Production Ledger');
    expect(screen.getByTestId('doc-preview-filename')).toHaveTextContent('Master_Ledger_Test.xlsx');
    expect(screen.getAllByText(/24\.0 KB/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders parsed preview table with rows', async () => {
    render(
      <DocumentPreviewSheet
        isOpen={true}
        onClose={vi.fn()}
        document={mockDoc}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lunch Catering')).toBeInTheDocument();
      expect(screen.getByText('$945.50')).toBeInTheDocument();
    });
  });

  it('renders download button and executes file download', async () => {
    // Mock URL.createObjectURL and revokeObjectURL
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    render(
      <DocumentPreviewSheet
        isOpen={true}
        onClose={vi.fn()}
        document={mockDoc}
      />
    );

    const downloadBtn = screen.getByTestId('btn-download-doc');
    expect(downloadBtn).toBeInTheDocument();

    fireEvent.click(downloadBtn);
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('renders Save to Drive as disabled with BLOCKER-001 notice', () => {
    render(
      <DocumentPreviewSheet
        isOpen={true}
        onClose={vi.fn()}
        document={mockDoc}
      />
    );

    const saveDriveBtn = screen.getByTestId('btn-save-drive');
    expect(saveDriveBtn).toBeDisabled();
    expect(saveDriveBtn).toHaveAttribute('aria-disabled', 'true');
    expect(saveDriveBtn).toHaveAttribute('title', 'Login Google required (blocked by BLOCKER-001)');

    expect(screen.getByText(/BLOCKER-001/)).toBeInTheDocument();
  });
});
