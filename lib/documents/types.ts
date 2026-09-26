// CLOSEDBOOK PRODUCTION OS — DOCUMENT GENERATION TYPES & SCHEMAS

export type DocumentTemplateType = 'ledger' | 'call-sheet' | 'wrap-report';

export interface DocumentMetadata {
  templateType: DocumentTemplateType;
  title: string;
  filename: string;
  mimeType: string;
  estimatedSizeBytes: number;
  lastUpdated: string;
  templateVersion: string;
}

export interface DocumentGeneratorInput<T = unknown> {
  projectId: string;
  data: T;
  templateVersion?: string;
}

export interface GeneratedDocument {
  filename: string;
  mimeType: string;
  buffer: Uint8Array;
  metadata: DocumentMetadata;
}

export interface DocumentGenerationProgress {
  stage: 'downloading' | 'compiling' | 'finalizing';
  percent: number;
  message: string;
}

// Master Ledger Types (.xlsx)
export interface LedgerEntry {
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
}

export interface LedgerDocumentData {
  projectName: string;
  dateRange?: string;
  currency?: string;
  entries: LedgerEntry[];
}

// Daily Call Sheet Types (.docx)
export interface SceneItem {
  sceneNumber: string;
  dayNight: 'DAY' | 'NIGHT' | string;
  pages: string;
  description: string;
  cast: string;
  location: string;
}

export interface CastMember {
  character: string;
  actor: string;
  callTime: string;
  pickupTime?: string;
  notes?: string;
}

export interface CallSheetData {
  productionTitle: string;
  shootDay: number;
  totalDays: number;
  date: string;
  generalCrewCall: string;
  weatherForecast?: string;
  nearestHospital?: string;
  scenes: SceneItem[];
  cast: CastMember[];
}

// Wrap Report Types (.xlsx)
export interface DepartmentExpense {
  department: string;
  budget: number;
  actualToday: number;
  actualToDate: number;
  variance?: number; // optional, can be calculated via formula
}

export interface WrapReportData {
  productionTitle: string;
  dayNumber: number;
  totalDays: number;
  date: string;
  producer: string;
  director: string;
  departments: DepartmentExpense[];
  notes?: string;
}
