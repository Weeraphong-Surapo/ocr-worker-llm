import { Worker } from 'bullmq';
import type { DocumentJob, DocumentService } from '../modules/documents/service.js';
import { DOCUMENT_QUEUE_NAME } from '../queues/document.queue.js';

export function createDocumentWorker(redisUrl: string, service: DocumentService): Worker<DocumentJob> {
  const worker = new Worker<DocumentJob>(
    DOCUMENT_QUEUE_NAME,
    async (job) => service.processJob(job.data),
    {
      connection: { url: redisUrl, maxRetriesPerRequest: null },
      concurrency: 1,
      lockDuration: 120_000,
    },
  );
  worker.on('failed', (job, error) => {
    console.error(JSON.stringify({ event: 'ocr_job_failed', job_id: job?.id, document_id: job?.data.documentId, error: error.message }));
  });
  worker.on('error', (error) => console.error(JSON.stringify({ event: 'ocr_worker_error', error: error.message })));
  return worker;
}
