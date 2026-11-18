import { randomUUID } from 'node:crypto';
import type { DocumentStore } from './store.js';
import type { DocumentRecord, DocumentType } from './types.js';
import type { OcrClient } from '../ocr/client.js';
import type { DocumentQueue } from '../../queues/document.queue.js';

export interface DocumentJob {
  documentId: string;
  dataBase64: string;
}

export class DocumentService {
  constructor(
    private readonly store: DocumentStore,
    private readonly ocrClient: OcrClient,
    private readonly queue: DocumentQueue,
  ) {}

  async create(input: { type: DocumentType; filename: string; mimeType: string; data: Buffer }): Promise<DocumentRecord> {
    const now = new Date().toISOString();
    const record: DocumentRecord = {
      document_id: `doc_${randomUUID()}`,
      document_type: input.type,
      original_filename: input.filename,
      mime_type: input.mimeType,
      size_bytes: input.data.length,
      status: 'queued',
      created_at: now,
      updated_at: now,
    };
    await this.store.create(record);
    await this.queue.enqueue({ documentId: record.document_id, dataBase64: input.data.toString('base64') });
    return record;
  }

  get(id: string): Promise<DocumentRecord | undefined> {
    return this.store.get(id);
  }

  async reprocess(id: string, data: Buffer): Promise<DocumentRecord | undefined> {
    const record = await this.store.update(id, { status: 'queued', error: undefined });
    if (record) await this.queue.enqueue({ documentId: record.document_id, dataBase64: data.toString('base64') });
    return record;
  }

  async processJob(job: DocumentJob): Promise<void> {
    await this.process(job.documentId, Buffer.from(job.dataBase64, 'base64'));
  }

  private async process(id: string, data: Buffer): Promise<void> {
    const record = await this.store.get(id);
    if (!record) return;
    await this.store.update(id, { status: 'processing' });
    try {
      const result = await this.ocrClient.process({
        data,
        filename: record.original_filename,
        mimeType: record.mime_type,
      });
      await this.store.update(id, { status: 'completed', result, error: undefined });
    } catch (error) {
      await this.store.update(id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'OCR failed',
      });
    }
  }
}
