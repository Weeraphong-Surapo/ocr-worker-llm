import { Router } from 'express';
import type { OcrClient } from '../ocr/client.js';

export function createHealthRouter(ocrClient: OcrClient): Router {
  const router = Router();
  router.get('/', async (_req, res) => {
    try {
      const ocr = await ocrClient.health();
      return res.json({ status: 'ok', ocr });
    } catch (error) {
      return res.status(503).json({ status: 'degraded', ocr: 'unavailable', error: error instanceof Error ? error.message : 'OCR unavailable' });
    }
  });
  router.get('/gpu', async (_req, res) => {
    try {
      return res.json(await ocrClient.gpuHealth());
    } catch (error) {
      return res.status(503).json({ available: false, error: error instanceof Error ? error.message : 'GPU health unavailable' });
    }
  });
  return router;
}
