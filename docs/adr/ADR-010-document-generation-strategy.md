# ADR-010: Document Generation Strategy — Lazy-Loaded ExcelJS & Docx

**Status**: Accepted  
**Date**: 2026-09-26  
**Deciders**: Executor + Director  
**Related**: T2.1, T2.2, ADR-004, `lib/documents/`

---

## Context

In Task 2 (G.6 Unblocked Parts), ClosedBook provides client-side generation for industry-standard production documents:
1. **Master Ledger** (`.xlsx`) — production accounts, currency formats, freeze panes, category subtotals, and `=SUM(...)` formulas.
2. **Daily Call Sheet** (`.docx`) — schedule, scene breakdown, crew call times, emergency contacts, and formatted tables.
3. **Wrap Report** (`.xlsx`) — daily actuals vs. budget variance, burn rate, and reconciliation summaries.

ClosedBook enforces strict performance and security budgets:
- Client bundle impact on `/workspace` must not exceed the raw 245 KB budget.
- Zero-server-retention architecture: all document compilation must occur in-memory on the client without transmitting data to any backend.
- Zero known critical CVEs.

---

## Evaluation of Alternatives

Using Context7 MCP research and package audits, four approaches were evaluated:

| Approach | Bundle Impact (Uncompressed) | Features & Styling | Security & Licensing | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **`exceljs`** | ~480 KB (uncompressed) | Native freeze panes, `=SUM()` formula support, rich cell colors/borders/alignments, stream/buffer export | MIT License, active maintenance, no critical CVEs | **Adopted for .xlsx** (Lazy-loaded) |
| **`docx`** (Dolan Miu) | ~310 KB (uncompressed) | Structured tables, paragraph styling, header/footer, borders, native buffer export | MIT License, 84+ reputation, active TS codebase | **Adopted for .docx** (Lazy-loaded) |
| **`xlsx`** (SheetJS) | ~300 KB | Cell formatting/styling is restricted to Pro (commercial paid); community version lacks cell styling | Apache 2.0 / Commercial Pro barrier, past CVE-2023-30533 | **Rejected** (Style limitations in CE) |
| **Manual OpenXML (JSZip)** | ~30 KB | Extremely low bundle footprint; already used for basic template seeding (`lib/templates/seeder.ts`) | MIT License, zero CVE | **Rejected for complex documents** (High XML complexity, fragile maintenance for complex formulas/tables) |

---

## Decision

1. **Adopt `exceljs` for Spreadsheets (`.xlsx`)**:
   - Master Ledger and Wrap Report generators utilize `exceljs` to support header freezing (`ySplit: 1`), currency number formatting (`"$#,##0.00"` / `"Rp #,##0"`), formula cells (`=SUM(...)`), and column dimension auto-sizing.
2. **Adopt `docx` for Word Documents (`.docx`)**:
   - Daily Call Sheet generator utilizes `docx` (`Paragraph`, `Table`, `TableRow`, `TableCell`, `WidthType`) to format call times, scene rundowns, and medical/safety advisories.
3. **Mandatory Dynamic Import (Lazy Loading)**:
   - Neither `exceljs` nor `docx` will be bundled into the initial `/workspace` route bundle.
   - All generator functions are invoked through a lazy module loader (`lib/documents/index.ts`) that triggers dynamic `import('exceljs')` and `import('docx')` only upon user request.
   - Initial `/workspace` first-load bundle impact is **0 KB**.

---

## Consequences

- **Positive**:
  - Full fidelity documents with real `=SUM(...)` formulas and cell styling readable directly by Microsoft Excel, Apple Numbers, and Google Sheets.
  - Zero server cost or data exposure: binary buffers are compiled client-side in memory as `Uint8Array`.
  - Initial load times and Core Web Vitals remain completely unaffected by heavy document generation libraries.
- **Negative / Mitigations**:
  - First-time document generation has a transient ~100-200ms network fetch for the dynamic chunk; mitigated by displaying an instant spinner inside `DocumentPreviewSheet`.
