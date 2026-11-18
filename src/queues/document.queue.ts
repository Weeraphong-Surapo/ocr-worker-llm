import { Queue } from 'bullmq';
import type { DocumentJob } from '../modules/documents/service.js';

export const DOCUMENT_QUEUE_NAME = 'thai-ocr-documents';

export interface DocumentQueue {
  enqueue(job: DocumentJob): Promise<void>;
}

export class BullDocumentQueue implements DocumentQueue {
  readonly queue: Queue<DocumentJob>;

  constructor(redisUrl: string) {
    const connection = { url: redisUrl, maxRetriesPerRequest: null };
    this.queue = new Queue<DocumentJob>(DOCUMENT_QUEUE_NAME, { connection });
  }

  async enqueue(job: DocumentJob): Promise<void> {
    await this.queue.add('ocr-document', job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export class InlineDocumentQueue implements DocumentQueue {
  constructor(private readonly handler: (job: DocumentJob) => Promise<void>) {}

  async enqueue(job: DocumentJob): Promise<void> {
    queueMicrotask(() => void this.handler(job));
  }
}
