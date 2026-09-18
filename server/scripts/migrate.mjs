import dotenv from 'dotenv';
import path from 'path';
import fs from 'node:fs/promises';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, '.env'), override: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const sql = await fs.readFile(path.join(root, 'supabase/migrations/001_init.sql'), 'utf8');
const statements = sql
  .split(';')
  .map((part) => part.trim())
  .filter((part) => part.length > 0 && !part.startsWith('--'));

for (const statement of statements) {
  try {
    await client.query(statement);
    console.log('applied', statement.slice(0, 48).replaceAll('\n', ' '));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.log('skipped', statement.slice(0, 48).replaceAll('\n', ' '), message);
  }
}

const check = await client.query('select count(*)::int as n from public.shares');
console.log('shares_ready', check.rows[0].n);
await client.end();
