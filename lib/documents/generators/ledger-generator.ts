// CLOSEDBOOK PRODUCTION OS — MASTER LEDGER GENERATOR (.xlsx)
import ExcelJS from 'exceljs';
import type { DocumentGeneratorInput, LedgerDocumentData } from '../types';

/**
 * Pure generator function to compile Master Ledger as an Excel (.xlsx) binary.
 * Freezes header row 1, applies styling, adds currency formatting, and includes SUM formula.
 */
export async function generateMasterLedger(
  input: DocumentGeneratorInput<LedgerDocumentData>
): Promise<Uint8Array> {
  const { data } = input;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ClosedBook Production OS';
  workbook.lastModifiedBy = 'ClosedBook Client';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Master Ledger', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }],
    pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0, orientation: 'landscape' },
  });

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Description', key: 'description', width: 32 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Payment Method', key: 'paymentMethod', width: 18 },
    { header: 'Amount', key: 'amount', width: 18 },
    { header: 'Notes', key: 'notes', width: 28 },
  ];

  // Header styling
  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1C1917' }, // Dark charcoal/slate
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF44403C' } },
    };
  });

  // Populate data rows
  const entries = data.entries || [];
  entries.forEach((entry) => {
    const row = sheet.addRow({
      date: entry.date,
      description: entry.description,
      category: entry.category,
      paymentMethod: entry.paymentMethod || 'Petty Cash',
      amount: entry.amount,
      notes: entry.notes || '',
    });

    row.height = 20;
    // Align amount to right and set format
    const amountCell = row.getCell('amount');
    amountCell.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
    amountCell.alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell('date').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('description').alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell('category').alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell('paymentMethod').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('notes').alignment = { horizontal: 'left', vertical: 'middle' };
  });

  // Append Total Row with =SUM formula
  const hasEntries = entries.length > 0;
  const startRowIndex = 2;
  const endRowIndex = hasEntries ? entries.length + 1 : 2;
  const totalRowIndex = hasEntries ? entries.length + 2 : 3;

  if (!hasEntries) {
    const emptyRow = sheet.getRow(2);
    emptyRow.getCell(2).value = 'No entries recorded';
    emptyRow.getCell(5).value = 0;
    emptyRow.getCell(5).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
  }

  const totalRow = sheet.getRow(totalRowIndex);
  totalRow.height = 24;

  const totalLabelCell = totalRow.getCell(4);
  totalLabelCell.value = 'TOTAL';
  totalLabelCell.font = { bold: true, size: 11, name: 'Calibri' };
  totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totalAmountCell = totalRow.getCell(5);
  // Formula: =SUM(E2:E...)
  totalAmountCell.value = {
    formula: `SUM(E${startRowIndex}:E${endRowIndex})`,
    result: entries.reduce((acc, curr) => acc + (curr.amount || 0), 0),
  };
  totalAmountCell.font = { bold: true, size: 11, name: 'Calibri' };
  totalAmountCell.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
  totalAmountCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalAmountCell.border = {
    top: { style: 'thin', color: { argb: 'FF1C1917' } },
    bottom: { style: 'double', color: { argb: 'FF1C1917' } },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
