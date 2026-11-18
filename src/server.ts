import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { BullDocumentQueue } from './queues/document.queue.js';
import { createDocumentWorker } from './workers/document.worker.js';
import { Pool } from 'pg';
import { migrateDatabase } from './services/database.js';
import { PostgresDocumentStore } from './modules/documents/store.js';

const env = loadEnv();

async function main(): Promise<void> {
  const queue = new BullDocumentQueue(env.REDIS_URL);
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  await migrateDatabase(pool);
  const app = createApp({ env, queue, store: new PostgresDocumentStore(pool) });
  const worker = createDocumentWorker(env.REDIS_URL, app.locals.documentService);

  app.listen(env.PORT, () => {
    console.log(`Thai OCR API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    await worker.close();
    await queue.close();
    await pool.end();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
