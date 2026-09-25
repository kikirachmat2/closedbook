// CLOSEDBOOK PRODUCTION OS — DOCUMENT GENERATORS UNIT TESTS
import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { generateMasterLedger } from '../../lib/documents/generators/ledger-generator';
import { generateCallSheet } from '../../lib/documents/generators/call-sheet-generator';
import { generateWrapReport } from '../../lib/documents/generators/wrap-report-generator';
import { generateDocument, parseDocumentPreview } from '../../lib/documents/index';

describe('Document Generators (T2.2)', () => {
  describe('Master Ledger Generator (.xlsx)', () => {
    const mockLedgerData = {
      projectName: 'Catering Run Test',
      entries: [
        {
          date: '2026-09-26',
          description: 'Crew Lunch Catering 40 Pax',
          category: 'Catering',
          paymentMethod: 'Cash',
          amount: 850.5,
          notes: 'Receipt #4021',
        },
        {
          date: '2026-09-26',
          description: 'Gaffer Tape & Batteries',
          category: 'Camera/Grip',
          paymentMethod: 'Petty Cash',
          amount: 145.0,
          notes: 'Hardware store invoice',
        },
      ],
    };

    it('generates a valid non-empty Uint8Array buffer', async () => {
      const buffer = await generateMasterLedger({
        projectId: 'proj-123',
        data: mockLedgerData,
      });

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(1000);
    });

    it('parses back and verifies structure, freeze row 1, and headers', async () => {
      const buffer = await generateMasterLedger({
        projectId: 'proj-123',
        data: mockLedgerData,
      });

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

      const sheet = wb.getWorksheet('Master Ledger');
      expect(sheet).toBeDefined();

      // Verify freeze row 1
      const views = sheet?.views || [];
      expect(views.length).toBeGreaterThan(0);
      expect(views[0].state).toBe('frozen');
      expect(views[0].ySplit).toBe(1);

      // Verify headers
      const row1 = sheet?.getRow(1);
      expect(row1?.getCell(1).value).toBe('Date');
      expect(row1?.getCell(2).value).toBe('Description');
      expect(row1?.getCell(5).value).toBe('Amount');

      // Verify header styling
      expect(row1?.getCell(1).font?.bold).toBe(true);
      expect(row1?.getCell(1).fill?.type).toBe('pattern');
    });

    it('verifies formula cell =SUM(...) is present and correctly calculated', async () => {
      const buffer = await generateMasterLedger({
        projectId: 'proj-123',
        data: mockLedgerData,
      });

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
      const sheet = wb.getWorksheet('Master Ledger');

      // Entries length = 2, header is row 1, data rows are 2 and 3, total is row 4
      const totalRow = sheet?.getRow(4);
      expect(totalRow?.getCell(4).value).toBe('TOTAL');

      const formulaCell = totalRow?.getCell(5);
      const formulaVal = formulaCell?.value as { formula: string; result: number };
      expect(formulaVal.formula).toBe('SUM(E2:E3)');
      expect(formulaVal.result).toBeCloseTo(995.5, 2);
    });
    it('handles zero entries edge case gracefully with valid total formula', async () => {
      const buffer = await generateMasterLedger({
        projectId: 'proj-zero',
        data: {
          projectName: 'Zero Entries Project',
          entries: [],
        },
      });

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
      const sheet = wb.getWorksheet('Master Ledger');

      const totalRow = sheet?.getRow(3);
      expect(totalRow?.getCell(4).value).toBe('TOTAL');
      const formulaVal = totalRow?.getCell(5).value as { formula: string; result: number };
      expect(formulaVal.formula).toBe('SUM(E2:E2)');
      expect(Number(formulaVal.result ?? 0)).toBe(0);
    });
  });

  describe('Daily Call Sheet Generator (.docx)', () => {
    const mockCallSheetData = {
      productionTitle: 'Shadow Protocol',
      shootDay: 3,
      totalDays: 14,
      date: '2026-09-27',
      generalCrewCall: '06:00 AM',
      nearestHospital: 'Metro General Hospital (1.2 miles)',
      weatherForecast: 'Partly cloudy, 22°C',
      scenes: [
        {
          sceneNumber: '14A',
          dayNight: 'DAY',
          pages: '2 3/8',
          description: 'Alleyway confrontation and chase sequence',
          cast: '1, 2, 4',
          location: 'Backlot B - Warehouse District',
        },
      ],
      cast: [
        {
          character: 'Agent Vance',
          actor: 'Marcus Brody',
          callTime: '06:30 AM',
          notes: 'Wardrobe: Tactical outfit B',
        },
      ],
    };

    it('generates a valid non-empty Uint8Array buffer', async () => {
      const buffer = await generateCallSheet({
        projectId: 'proj-123',
        data: mockCallSheetData,
      });

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(1500);

      // Verify PK zip header (OpenXML files start with PK [0x50, 0x4B, 0x03, 0x04])
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
    });

    it('generates call sheet with fallback hospital and weather when omitted', async () => {
      const buffer = await generateCallSheet({
        projectId: 'proj-minimal',
        data: {
          productionTitle: 'Minimal Shoot',
          shootDay: 1,
          totalDays: 1,
          date: '2026-09-27',
          generalCrewCall: '07:00 AM',
          scenes: [],
          cast: [],
        },
      });

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(1000);
    });
  });

  describe('Wrap Report Generator (.xlsx)', () => {
    const mockWrapData = {
      productionTitle: 'Shadow Protocol',
      dayNumber: 3,
      totalDays: 14,
      date: '2026-09-27',
      producer: 'Sarah Chen',
      director: 'Kiki Rachmat',
      departments: [
        {
          department: 'Camera',
          budget: 15000,
          actualToday: 1200,
          actualToDate: 4500,
        },
        {
          department: 'Sound',
          budget: 8000,
          actualToday: 600,
          actualToDate: 1800,
        },
      ],
    };

    it('generates a valid wrap report with frozen views and variance formulas', async () => {
      const buffer = await generateWrapReport({
        projectId: 'proj-123',
        data: mockWrapData,
      });

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
      const sheet = wb.getWorksheet('Daily Wrap Report');

      expect(sheet).toBeDefined();
      expect(sheet?.views[0].state).toBe('frozen');

      // Verify row 2 variance formula =B2-D2
      const deptRow1 = sheet?.getRow(2);
      const varianceVal = deptRow1?.getCell(5).value as { formula: string; result: number };
      expect(varianceVal.formula).toBe('B2-D2');
      expect(varianceVal.result).toBe(10500);

      // Verify summary total formulas
      const totalRow = sheet?.getRow(4);
      expect(totalRow?.getCell(1).value).toBe('TOTAL PRODUCTION');
      const totalBudget = totalRow?.getCell(2).value as { formula: string };
      expect(totalBudget.formula).toBe('SUM(B2:B3)');
    });

    it('handles empty department wrap report without errors', async () => {
      const buffer = await generateWrapReport({
        projectId: 'proj-empty',
        data: {
          productionTitle: 'Empty Wrap',
          dayNumber: 1,
          totalDays: 5,
          date: '2026-09-27',
          producer: 'Test',
          director: 'Test',
          departments: [],
        },
      });

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(1000);
    });
  });

  describe('Public API & Lazy Preview Parser', () => {
    it('generateDocument executes lazy dispatch correctly', async () => {
      const result = await generateDocument('ledger', {
        projectId: 'proj-456',
        data: {
          projectName: 'Lazy Test',
          entries: [{ date: '2026-09-26', description: 'Test Item', category: 'Misc', amount: 100 }],
        },
      });

      expect(result.filename).toContain('Master_Ledger_proj-456');
      expect(result.metadata.templateType).toBe('ledger');
      expect(result.buffer.byteLength).toBeGreaterThan(0);

      // Test parseDocumentPreview
      const preview = await parseDocumentPreview('ledger', result.buffer);
      expect(preview.length).toBeGreaterThan(0);
      expect(preview[0]).toContain('Date');
      expect(preview[0]).toContain('Description');
    });

    it('throws error for unsupported template type', async () => {
      await expect(
        generateDocument('unsupported-type' as any, {
          projectId: 'bad-proj',
          data: {},
        })
      ).rejects.toThrow(/Unsupported document template type/);
    });
  });
});
