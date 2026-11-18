import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  OCR_ENGINE_URL: z.string().url().default('http://localhost:8000'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  DATABASE_URL: z.string().url().default('postgresql://thaiocr:thaiocr@localhost:55432/thaiocr'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(20),
  MAX_PDF_PAGES: z.coerce.number().int().positive().default(50),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
