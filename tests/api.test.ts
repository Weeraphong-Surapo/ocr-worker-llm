import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { OcrClient } from '../src/modules/ocr/client.js';

const fakeOcr: OcrClient = {
  health: async () => ({ status: 'ok', ocr_model_loaded: true }),
  gpuHealth: async () => ({ available: true, device: 'gpu:0', device_count: 1 }),
  process: async () => ({
    status: 'completed',
    pages: [{ page_number: 1, text: 'บริษัท ตัวอย่าง จำกัด', lines: [{ text: 'บริษัท ตัวอย่าง จำกัด', confidence: 0.98, bbox: [[10, 20], [300, 20], [300, 50], [10, 50]] }] }],
  }),
};

describe('documents API', () => {
  const app = createApp({ env: { PORT: 3000, OCR_ENGINE_URL: 'http://localhost:8000', REDIS_URL: 'redis://localhost:6379', MAX_UPLOAD_MB: 1, MAX_PDF_PAGES: 50 }, ocrClient: fakeOcr });

  it('uploads and returns OCR result', async () => {
    const created = await request(app).post('/api/v1/documents').field('document_type', 'receipt').attach('file', Buffer.from('image'), 'receipt.png').expect(202);
    expect(created.body.document_id).toMatch(/^doc_/);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const result = await request(app).get(`/api/v1/documents/${created.body.document_id}/result`).expect(200);
    expect(result.body.pages[0].lines[0].text).toBe('บริษัท ตัวอย่าง จำกัด');
  });

  it('rejects unsupported document type', async () => {
    await request(app).post('/api/v1/documents').field('document_type', 'other').attach('file', Buffer.from('image'), 'x.png').expect(422);
  });

  it('exposes health and gpu health', async () => {
    await request(app).get('/api/v1/health').expect(200);
    const gpu = await request(app).get('/api/v1/health/gpu').expect(200);
    expect(gpu.body.available).toBe(true);
  });

  it('exposes OpenAPI JSON and Swagger UI', async () => {
    const spec = await request(app).get('/api/openapi.json').expect(200);
    expect(spec.body.openapi).toBe('3.0.3');
    expect(spec.body.paths['/api/v1/documents']).toBeDefined();
    await request(app).get('/api/docs/').expect(200);
  });
});
