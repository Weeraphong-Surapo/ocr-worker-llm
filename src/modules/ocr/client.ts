import type { OcrResult } from '../documents/types.js';

export interface OcrClient {
  health(): Promise<{ status: string; ocr_model_loaded?: boolean }>;
  gpuHealth(): Promise<unknown>;
  process(input: { data: Buffer; filename: string; mimeType: string }): Promise<OcrResult>;
}

export class HttpOcrClient implements OcrClient {
  constructor(private readonly baseUrl: string) {}

  private async request(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(30_000),
    });
  }

  async health(): Promise<{ status: string; ocr_model_loaded?: boolean }> {
    const response = await this.request('/health');
    if (!response.ok) throw new Error(`OCR health failed: ${response.status}`);
    return (await response.json()) as { status: string; ocr_model_loaded?: boolean };
  }

  async gpuHealth(): Promise<unknown> {
    const response = await this.request('/health/gpu');
    if (!response.ok) throw new Error(`OCR GPU health failed: ${response.status}`);
    return response.json();
  }

  async process(input: { data: Buffer; filename: string; mimeType: string }): Promise<OcrResult> {
    const form = new FormData();
    form.append('file', new Blob([input.data], { type: input.mimeType }), input.filename);
    const response = await this.request('/ocr', { method: 'POST', body: form });
    if (!response.ok) throw new Error(`OCR failed: ${response.status} ${await response.text()}`);
    return (await response.json()) as OcrResult;
  }
}
