export const documentTypes = ['receipt', 'tax_invoice', 'invoice'] as const;
export type DocumentType = (typeof documentTypes)[number];
export type DocumentStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: [[number, number], [number, number], [number, number], [number, number]];
}

export interface OcrPage {
  page_number: number;
  text: string;
  lines: OcrLine[];
  width?: number;
  height?: number;
}

export interface OcrResult {
  status: 'completed';
  pages: OcrPage[];
}

export interface DocumentRecord {
  document_id: string;
  document_type: DocumentType;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  error?: string;
  result?: OcrResult;
  created_at: string;
  updated_at: string;
}
