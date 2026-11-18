import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { documentTypes } from './types.js';
import type { DocumentService } from './service.js';

const upload = (maxBytes: number) => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
});

const createSchema = z.object({ document_type: z.enum(documentTypes) });

export function createDocumentRouter(service: DocumentService, maxBytes: number): Router {
  const router = Router();
  const receive = upload(maxBytes).single('file');

  router.post('/', receive, async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'file is required' });
      const input = createSchema.safeParse(req.body);
      if (!input.success) return res.status(422).json({ error: 'invalid document_type', details: input.error.flatten() });
      const record = await service.create({
        type: input.data.document_type,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        data: req.file.buffer,
      });
      return res.status(202).json({ document_id: record.document_id, status: record.status, document_type: record.document_type });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:id', async (req, res) => {
    const record = await service.get(String(req.params.id));
    return record ? res.json(record) : res.status(404).json({ error: 'document_not_found' });
  });

  router.get('/:id/status', async (req, res) => {
    const record = await service.get(String(req.params.id));
    return record ? res.json({ document_id: record.document_id, status: record.status, error: record.error }) : res.status(404).json({ error: 'document_not_found' });
  });

  router.get('/:id/result', async (req, res) => {
    const record = await service.get(String(req.params.id));
    if (!record) return res.status(404).json({ error: 'document_not_found' });
    if (record.status !== 'completed' || !record.result) return res.status(409).json({ error: 'result_not_ready', status: record.status });
    return res.json({ document_id: record.document_id, status: record.status, document_type: record.document_type, pages: record.result.pages });
  });

  router.post('/:id/reprocess', receive, async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const record = await service.get(id);
      if (!record) return res.status(404).json({ error: 'document_not_found' });
      if (!req.file) return res.status(400).json({ error: 'file is required for phase 2 reprocess' });
      void service.reprocess(record.document_id, req.file.buffer);
      return res.status(202).json({ document_id: record.document_id, status: 'queued' });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
