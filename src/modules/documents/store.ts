import { Pool } from 'pg';
import type { DocumentRecord } from './types.js';

export interface DocumentStore {
  create(record: DocumentRecord): Promise<void>;
  get(id: string): Promise<DocumentRecord | undefined>;
  update(id: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord | undefined>;
  close?(): Promise<void>;
}

export class InMemoryDocumentStore implements DocumentStore {
  private readonly records = new Map<string, DocumentRecord>();

  async create(record: DocumentRecord): Promise<void> {
    this.records.set(record.document_id, record);
  }

  async get(id: string): Promise<DocumentRecord | undefined> {
    return this.records.get(id);
  }

  async update(id: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord | undefined> {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updated_at: new Date().toISOString() };
    this.records.set(id, next);
    return next;
  }
}

export class PostgresDocumentStore implements DocumentStore {
  constructor(private readonly pool: Pool) {}

  async create(record: DocumentRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO documents (document_id, document_type, original_filename, mime_type, size_bytes, status, error, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [record.document_id, record.document_type, record.original_filename, record.mime_type, record.size_bytes, record.status, record.error ?? null, record.created_at, record.updated_at],
    );
  }

  async get(id: string): Promise<DocumentRecord | undefined> {
    const result = await this.pool.query('SELECT * FROM documents WHERE document_id = $1', [id]);
    if (result.rowCount === 0) return undefined;
    const row = result.rows[0];
    const ocr = await this.pool.query('SELECT result_json FROM ocr_results WHERE document_id = $1', [id]);
    return this.map(row, ocr.rows[0]?.result_json);
  }

  async update(id: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord | undefined> {
    const current = await this.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updated_at: new Date().toISOString() };
    await this.pool.query(
      `UPDATE documents SET status=$2, error=$3, updated_at=$4 WHERE document_id=$1`,
      [id, next.status, next.error ?? null, next.updated_at],
    );
    if (next.result) {
      await this.pool.query(
        `INSERT INTO ocr_results (document_id, result_json, updated_at) VALUES ($1,$2,$3)
         ON CONFLICT (document_id) DO UPDATE SET result_json=EXCLUDED.result_json, updated_at=EXCLUDED.updated_at`,
        [id, JSON.stringify(next.result), next.updated_at],
      );
    }
    return next;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private map(row: Record<string, unknown>, result?: unknown): DocumentRecord {
    return {
      document_id: String(row.document_id),
      document_type: row.document_type as DocumentRecord['document_type'],
      original_filename: String(row.original_filename),
      mime_type: String(row.mime_type),
      size_bytes: Number(row.size_bytes),
      status: row.status as DocumentRecord['status'],
      error: row.error == null ? undefined : String(row.error),
      result: result as DocumentRecord['result'],
      created_at: new Date(String(row.created_at)).toISOString(),
      updated_at: new Date(String(row.updated_at)).toISOString(),
    };
  }
}
