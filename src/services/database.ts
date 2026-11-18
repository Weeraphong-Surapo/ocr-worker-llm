import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

export async function migrateDatabase(pool: Pool, migrationPath = 'migrations/001_documents.sql'): Promise<void> {
  const sql = await readFile(migrationPath, 'utf8');
  await pool.query(sql);
}
