// CLOSEDBOOK PRODUCTION OS — DOCUMENT GENERATION PUBLIC API (LAZY-LOADED)
import type {
  CallSheetData,
  DocumentGeneratorInput,
  DocumentMetadata,
  DocumentTemplateType,
  GeneratedDocument,
  LedgerDocumentData,
  WrapReportData,
} from './types';

export * from './types';

/**
 * Lazy loads and compiles documents on the client side.
 * Never bundles exceljs or docx into initial route chunk.
 */
export async function generateDocument(
  templateType: DocumentTemplateType,
  input: DocumentGeneratorInput
): Promise<GeneratedDocument> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  switch (templateType) {
    case 'ledger': {
      const { generateMasterLedger } = await import('./generators/ledger-generator');
      const buffer = await generateMasterLedger(input as DocumentGeneratorInput<LedgerDocumentData>);
      const filename = `Master_Ledger_${input.projectId || 'production'}_${timestamp}.xlsx`;
      const metadata: DocumentMetadata = {
        templateType: 'ledger',
        title: 'Master Production Ledger',
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        estimatedSizeBytes: buffer.byteLength,
        lastUpdated: new Date().toISOString(),
        templateVersion: input.templateVersion || '1.0.0',
      };
      return { filename, mimeType: metadata.mimeType, buffer, metadata };
    }

    case 'call-sheet': {
      const { generateCallSheet } = await import('./generators/call-sheet-generator');
      const buffer = await generateCallSheet(input as DocumentGeneratorInput<CallSheetData>);
      const filename = `Daily_Call_Sheet_${input.projectId || 'production'}_${timestamp}.docx`;
      const metadata: DocumentMetadata = {
        templateType: 'call-sheet',
        title: 'Daily Call Sheet',
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        estimatedSizeBytes: buffer.byteLength,
        lastUpdated: new Date().toISOString(),
        templateVersion: input.templateVersion || '1.0.0',
      };
      return { filename, mimeType: metadata.mimeType, buffer, metadata };
    }

    case 'wrap-report': {
      const { generateWrapReport } = await import('./generators/wrap-report-generator');
      const buffer = await generateWrapReport(input as DocumentGeneratorInput<WrapReportData>);
      const filename = `Daily_Wrap_Report_${input.projectId || 'production'}_${timestamp}.xlsx`;
      const metadata: DocumentMetadata = {
        templateType: 'wrap-report',
        title: 'Daily Wrap Report',
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        estimatedSizeBytes: buffer.byteLength,
        lastUpdated: new Date().toISOString(),
        templateVersion: input.templateVersion || '1.0.0',
      };
      return { filename, mimeType: metadata.mimeType, buffer, metadata };
    }

    default:
      throw new Error(`Unsupported document template type: ${templateType}`);
  }
}

/**
 * Parses binary buffer to extract the first 10 rows for HTML table preview in DocumentPreviewSheet.
 */
export async function parseDocumentPreview(
  templateType: DocumentTemplateType,
  buffer: Uint8Array
): Promise<string[][]> {
  if (templateType === 'ledger' || templateType === 'wrap-report') {
    const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
    const wb = new ExcelJS.Workbook();
    // ExcelJS load expects ArrayBuffer or Buffer
    const arrayBuf = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    await wb.xlsx.load(arrayBuf as any);
    const sheet = wb.worksheets[0];
    if (!sheet) return [];

    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 10) {
        const rowCells: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          let text = '';
          if (cell.value && typeof cell.value === 'object') {
            if ('result' in cell.value && cell.value.result !== undefined) {
              text = String(cell.value.result);
            } else if ('text' in cell.value && cell.value.text !== undefined) {
              text = String(cell.value.text);
            } else {
              text = JSON.stringify(cell.value);
            }
          } else if (cell.value !== null && cell.value !== undefined) {
            text = String(cell.value);
          }
          rowCells.push(text);
        });
        rows.push(rowCells);
      }
    });
    return rows;
  }

  // Call sheet (.docx) preview rows fallback
  return [
    ['Document Type', 'Daily Call Sheet (.docx)'],
    ['Preview Mode', 'OpenXML Document Ready'],
    ['Format', 'Word Processing Document (DOCX)'],
    ['Status', 'Compiled in memory (Zero-retention client buffer)'],
    ['Action', 'Tap Download to open in MS Word / Pages / Google Docs'],
  ];
}
