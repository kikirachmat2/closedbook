// CLOSEDBOOK PRODUCTION OS — DAILY CALL SHEET GENERATOR (.docx)
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from 'docx';
import type { CallSheetData, DocumentGeneratorInput } from '../types';

/**
 * Pure generator function to compile Daily Call Sheet as a Word (.docx) binary.
 * Includes title, general crew call, hospital advisory, scene breakdown table, and cast schedule.
 */
export async function generateCallSheet(
  input: DocumentGeneratorInput<CallSheetData>
): Promise<Uint8Array> {
  const { data } = input;

  const lightBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
  };

  const headerShading = {
    fill: '1C1917',
  };

  // Header Scene Rows
  const sceneHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        shading: headerShading,
        width: { size: 1200, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'SCENE', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: headerShading,
        width: { size: 1000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'D/N', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: headerShading,
        width: { size: 1000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'PGS', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: headerShading,
        width: { size: 3000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'DESCRIPTION', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: headerShading,
        width: { size: 1500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'CAST', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: headerShading,
        width: { size: 2300, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'SET / LOCATION', bold: true, color: 'FFFFFF' })] })],
      }),
    ],
  });

  const sceneRows = (data.scenes || []).map(
    (scene) =>
      new TableRow({
        children: [
          new TableCell({ borders: lightBorder, children: [new Paragraph(scene.sceneNumber)] }),
          new TableCell({ borders: lightBorder, children: [new Paragraph(scene.dayNight)] }),
          new TableCell({ borders: lightBorder, children: [new Paragraph(scene.pages)] }),
          new TableCell({ borders: lightBorder, children: [new Paragraph(scene.description)] }),
          new TableCell({ borders: lightBorder, children: [new Paragraph(scene.cast)] }),
          new TableCell({ borders: lightBorder, children: [new Paragraph(scene.location)] }),
        ],
      })
  );

  const sceneTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [sceneHeaderRow, ...sceneRows],
  });

  // Cast Call Table
  const castHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        shading: headerShading,
        width: { size: 2500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'CHARACTER', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: headerShading,
        width: { size: 3000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'ACTOR', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: headerShading,
        width: { size: 2000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'CALL TIME', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: headerShading,
        width: { size: 2500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'NOTES', bold: true, color: 'FFFFFF' })] })],
      }),
    ],
  });

  const castRows = (data.cast || []).map(
    (c) =>
      new TableRow({
        children: [
          new TableCell({ borders: lightBorder, children: [new Paragraph(c.character)] }),
          new TableCell({ borders: lightBorder, children: [new Paragraph(c.actor)] }),
          new TableCell({ borders: lightBorder, children: [new Paragraph(c.callTime)] }),
          new TableCell({ borders: lightBorder, children: [new Paragraph(c.notes || '')] }),
        ],
      })
  );

  const castTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [castHeaderRow, ...castRows],
  });

  const doc = new Document({
    creator: 'ClosedBook Production OS',
    title: `${data.productionTitle} — Daily Call Sheet Day ${data.shootDay}`,
    sections: [
      {
        children: [
          // Production Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: data.productionTitle.toUpperCase(),
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `DAY ${data.shootDay} OF ${data.totalDays}  |  DATE: ${data.date}`,
                bold: true,
                size: 24,
                color: '4B5563',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // General Crew Call
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `GENERAL CREW CALL: ${data.generalCrewCall}`,
                bold: true,
                size: 26,
                color: 'DC2626',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Nearest Hospital Safety Info
          new Paragraph({
            children: [
              new TextRun({ text: 'NEAREST HOSPITAL: ', bold: true, color: '111827' }),
              new TextRun({ text: data.nearestHospital || 'Local Emergency Center (Dial 911/112)' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'WEATHER: ', bold: true, color: '111827' }),
              new TextRun({ text: data.weatherForecast || 'Clear / Operational standard' }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Scene Schedule
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'SHOOTING SCHEDULE', bold: true, size: 22 })],
          }),
          sceneTable,
          new Paragraph({ text: '' }),

          // Cast Schedule
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'CAST & TALENT CALL TIMES', bold: true, size: 22 })],
          }),
          castTable,
        ],
      },
    ],
  });

  const arrayBuffer = await Packer.toArrayBuffer(doc);
  return new Uint8Array(arrayBuffer);
}
