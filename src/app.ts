import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { loadEnv, type Env } from './config/env.js';
import { HttpOcrClient, type OcrClient } from './modules/ocr/client.js';
import { DocumentService } from './modules/documents/service.js';
import { InMemoryDocumentStore, type DocumentStore } from './modules/documents/store.js';
import { createDocumentRouter } from './modules/documents/routes.js';
import { InlineDocumentQueue, type DocumentQueue } from './queues/document.queue.js';
import { createHealthRouter } from './modules/health/routes.js';
import { openapiDocument } from './config/openapi.js';

export function createApp(options?: { env?: Env; ocrClient?: OcrClient; queue?: DocumentQueue; store?: DocumentStore }): Express {
  const env = options?.env ?? loadEnv();
  const ocrClient = options?.ocrClient ?? new HttpOcrClient(env.OCR_ENGINE_URL);
  let documentService!: DocumentService;
  const queue = options?.queue ?? new InlineDocumentQueue(async (job) => documentService.processJob(job));
  documentService = new DocumentService(options?.store ?? new InMemoryDocumentStore(), ocrClient, queue);
  const app = express();
  app.locals.documentService = documentService;
  app.locals.documentQueue = queue;
  app.use(express.json());
  app.get('/api/openapi.json', (_req, res) => res.json(openapiDocument));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, { customSiteTitle: 'Thai OCR Service API' }));
  app.use('/api/v1/health', createHealthRouter(ocrClient));
  app.use('/api/v1/documents', createDocumentRouter(documentService, env.MAX_UPLOAD_MB * 1024 * 1024));
  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof Error && error.message.includes('File too large')) return res.status(413).json({ error: 'file_too_large' });
    return res.status(500).json({ error: 'internal_error' });
  });
  return app;
}
