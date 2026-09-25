// CLOSEDBOOK PRODUCTION OS — WRAP REPORT GENERATOR (.xlsx)
import ExcelJS from 'exceljs';
import type { DocumentGeneratorInput, WrapReportData } from '../types';

/**
 * Pure generator function to compile Daily Wrap Report as an Excel (.xlsx) binary.
 * Includes frozen header, departmental cost breakdown, variance calculations, and SUM formulas.
 */
export async function generateWrapReport(
  input: DocumentGeneratorInput<WrapReportData>
): Promise<Uint8Array> {
  const { data } = input;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ClosedBook Production OS';
  workbook.lastModifiedBy = 'ClosedBook Client';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Daily Wrap Report', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }],
    pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0, orientation: 'landscape' },
  });

  sheet.columns = [
    { header: 'Department', key: 'department', width: 26 },
    { header: 'Approved Budget', key: 'budget', width: 20 },
    { header: 'Actual Today', key: 'actualToday', width: 18 },
    { header: 'Actual To Date', key: 'actualToDate', width: 20 },
    { header: 'Variance (Remaining)', key: 'variance', width: 22 },
  ];

  // Header styling
  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1C1917' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF44403C' } },
    };
  });

  const currencyFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';

  // Add department rows
  const departments = data.departments || [];
  departments.forEach((dept, index) => {
    const rowNumber = index + 2;
    const row = sheet.addRow({
      department: dept.department,
      budget: dept.budget,
      actualToday: dept.actualToday,
      actualToDate: dept.actualToDate,
    });

    row.height = 20;

    // Variance = Approved Budget - Actual To Date: =B{row} - D{row}
    const varianceCell = row.getCell('variance');
    varianceCell.value = {
      formula: `B${rowNumber}-D${rowNumber}`,
      result: dept.budget - dept.actualToDate,
    };

    // Formats
    row.getCell('department').alignment = { horizontal: 'left', vertical: 'middle' };
    ['budget', 'actualToday', 'actualToDate', 'variance'].forEach((colKey) => {
      const cell = row.getCell(colKey);
      cell.numFmt = currencyFmt;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });

  // Total Summary Row
  const hasDepts = departments.length > 0;
  const startRowIndex = 2;
  const endRowIndex = hasDepts ? departments.length + 1 : 2;
  const totalRowIndex = hasDepts ? departments.length + 2 : 3;

  if (!hasDepts) {
    const emptyRow = sheet.getRow(2);
    emptyRow.getCell(1).value = 'No departments recorded';
  }

  const totalRow = sheet.getRow(totalRowIndex);
  totalRow.height = 24;

  const totalLabel = totalRow.getCell(1);
  totalLabel.value = 'TOTAL PRODUCTION';
  totalLabel.font = { bold: true, size: 11, name: 'Calibri' };
  totalLabel.alignment = { horizontal: 'left', vertical: 'middle' };

  // Total Budget =SUM(B2:B...)
  const totalBudget = totalRow.getCell(2);
  totalBudget.value = {
    formula: `SUM(B${startRowIndex}:B${endRowIndex})`,
    result: departments.reduce((acc, d) => acc + (d.budget || 0), 0),
  };

  // Total Today =SUM(C2:C...)
  const totalToday = totalRow.getCell(3);
  totalToday.value = {
    formula: `SUM(C${startRowIndex}:C${endRowIndex})`,
    result: departments.reduce((acc, d) => acc + (d.actualToday || 0), 0),
  };

  // Total To Date =SUM(D2:D...)
  const totalToDate = totalRow.getCell(4);
  totalToDate.value = {
    formula: `SUM(D${startRowIndex}:D${endRowIndex})`,
    result: departments.reduce((acc, d) => acc + (d.actualToDate || 0), 0),
  };

  // Total Variance =B{total}-D{total}
  const totalVariance = totalRow.getCell(5);
  totalVariance.value = {
    formula: `B${totalRowIndex}-D${totalRowIndex}`,
    result:
      departments.reduce((acc, d) => acc + (d.budget || 0), 0) -
      departments.reduce((acc, d) => acc + (d.actualToDate || 0), 0),
  };

  [totalBudget, totalToday, totalToDate, totalVariance].forEach((cell) => {
    cell.font = { bold: true, size: 11, name: 'Calibri' };
    cell.numFmt = currencyFmt;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1C1917' } },
      bottom: { style: 'double', color: { argb: 'FF1C1917' } },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
